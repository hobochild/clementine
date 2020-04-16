import { gql } from 'apollo-boost'
import React, { useRef, useContext } from 'react'
import { useMutation, useQuery } from '@apollo/react-hooks'
import { useLocation, Link } from 'react-router-dom'
import { cloneDeep } from 'lodash'
import { FiltersContext } from '../trace'
import { ErrorBanner, Loading } from '../utils'
import Nav from '../nav'
import { KeyList, KeyCreate } from '../key'
import KeyMetics from '../keyMetrics'
import graphListStyles from './graph-list.module.css'

const GET_GRAPHS = gql`
  query GRAPH_LIST(
    $traceFilters: [TraceFilter]
    $to: DateTime
    $from: DateTime
  ) {
    user {
      id
      graphs {
        id
        name
        stats(to: $to, from: $from, traceFilters: $traceFilters) {
          errorCount
          errorPercent
          count
          duration
        }
      }
    }
  }
`

export function GraphList() {
  const { filters, from, to } = useContext(FiltersContext)
  const { loading, error, data } = useQuery(GET_GRAPHS, {
    variables: {
      traceFilters: filters,
      to,
      from
    }
  })

  if (loading) return <Loading />
  if (error) return <ErrorBanner error={error} />

  if (!data.user) {
    return <div>Not Found</div>
  }

  return (
    <main>
      <GraphCreate />
      <div className={graphListStyles.wrapper}>
        {data.user.graphs.length > 0 ? (
          data.user.graphs.map(graph => {
            return (
              <Link to={`/graph/${graph.id}/operation`}>
                <div className={graphListStyles.row} key={graph.id}>
                  {graph.name}
                  <KeyMetics {...graph.stats} />
                </div>
              </Link>
            )
          })
        ) : (
          <p>No graphs - create one!</p>
        )}
      </div>
    </main>
  )
}

const GRAPH_CREATE = gql`
  mutation CREATE_GRAPH($name: String!) {
    graphCreate(name: $name) {
      id
      name
      stats {
        errorCount
        errorPercent
        count
        duration
      }
    }
  }
`

export function GraphCreate() {
  const nameRef = useRef()
  const [gc] = useMutation(GRAPH_CREATE)
  const [, setLocation] = useLocation()

  return (
    <div>
      <form
        className="form-inline"
        onSubmit={async e => {
          e.preventDefault()
          try {
            const {
              data: { graphCreate: graph }
            } = await gc({
              variables: {
                name: nameRef.current.value
              },
              update: (cache, { data: { graphCreate } }) => {
                const prevData = cache.readQuery({
                  query: GET_GRAPHS
                })

                // cloneDeep is necessary for the cache to pickup the change
                // and have the observable components rerender
                const data = cloneDeep(prevData)
                if (!data.user.graphs) {
                  data.user.graphs = []
                }
                data.user.graphs.push(graphCreate)

                cache.writeQuery({
                  query: GET_GRAPHS,
                  data
                })

                // clear form on success
                nameRef.current.value = ''
              }
            })
          } catch (e) {
            alert(e.message)
          }
        }}
      >
        <input type="text" ref={nameRef} />
        <button type="submit">Create Graph</button>
      </form>
    </div>
  )
}

const SHOW_GRAPH = gql`
  query GRAPH_SHOW(
    $graphId: ID!
    $traceFilters: [TraceFilter]
    $from: DateTime
    $to: DateTime
  ) {
    graph(graphId: $graphId) {
      id
      name
      stats(traceFilters: $traceFilters, from: $from, to: $to) {
        count
        duration
        errorCount
        errorPercent
      }
    }
  }
`

export function GraphHeader({ graphId }) {
  const { filters, from, to } = useContext(FiltersContext)
  const { loading, error, data } = useQuery(SHOW_GRAPH, {
    variables: { graphId, traceFilters: filters, from, to }
  })

  const items = [
    {
      to: `/graph/${graphId}/operation`,
      title: 'Operations'
    },
    {
      to: `/graph/${graphId}/rpm`,
      title: 'Requests over time'
    },
    {
      to: `/graph/${graphId}/ld`,
      title: 'Latency Distribution'
    },
    {
      to: `/graph/${graphId}/settings`,
      title: 'Settings'
    }
  ]

  if (loading) return <Loading />
  if (error) return <ErrorBanner error={error} />

  if (!data.graph) {
    return <div>Not Found</div>
  }

  return (
    <div>
      <main>
        <header>
          <h2>{data.graph.name}</h2>
          <div>
            <Filters graphId={graphId} />
            <KeyMetics {...data.graph.stats} />
          </div>
        </header>
      </main>
      <Nav items={items} />
    </div>
  )
}

export const GRAPH_SETTINGS = gql`
  query GRAPH_SETTINGS($graphId: ID!) {
    graph(graphId: $graphId) {
      id
      name
      keys {
        id
        secret
      }
    }
  }
`

export function GraphSettings({ graphId }) {
  const { loading, error, data } = useQuery(GRAPH_SETTINGS, {
    variables: { graphId }
  })

  if (loading) return <Loading />
  if (error) return <ErrorBanner error={error} />

  if (!data.graph) {
    return <div>Not Found</div>
  }

  return (
    <main>
      <p>API Keys</p>
      <KeyCreate graphId={data.graph.id} />
      <KeyList keys={data.graph.keys} />
    </main>
  )
}
