import * as path from 'path'
export default function(activityPaths: string[], outputPath: string) {
  const NODE_ENV = process.env.NODE_ENV || 'development'
  const isDev = NODE_ENV === 'development'
  return {
    entry: activityPaths,
    output: {
      path: outputPath,
      filename: 'activities.js'
    },
    // Currently we need to add '.ts' to the resolve.extensions array.
    resolve: {
      extensions: ['.js', '.json']
    },

    // Source maps support ('inline-source-map' also works)
    devtool: isDev ? 'eval-source-map' : 'source-map',

    // Add the loader for .ts files.
    module: {
      loaders: [
        {
          test: /\.json$/,
          loader: 'json'
        }
      ]
    }
  }
}
