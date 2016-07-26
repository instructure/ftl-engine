import * as React from 'react'
import darkBaseTheme from 'material-ui/styles/baseThemes/darkBaseTheme'
import MuiThemeProvider from 'material-ui/styles/MuiThemeProvider'
import getMuiTheme from 'material-ui/styles/getMuiTheme'
import AppBar from 'material-ui/AppBar'

export interface IAppProps extends React.Props<any> {

}
export default class AppContainer extends React.Component<IAppProps, void> {
  render() {
    return (
      <MuiThemeProvider muiTheme={getMuiTheme(darkBaseTheme)}>
        <AppBar title='FTL Engine' />
      </MuiThemeProvider>
    )
  }
}
