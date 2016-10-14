import * as React from 'react'

export default function(props) {
  const {params, env} = props
  return (
    <div>
      <h2>Script Info</h2>
      <pre>{params.script || params.scriptUrl}</pre>
    </div>
  )
}
