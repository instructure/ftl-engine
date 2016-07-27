
import * as React from 'react'
import DropDownMenu from 'material-ui/DropDownMenu'
import MenuItem from 'material-ui/MenuItem'

export interface IDomainMenu extends React.Props<any> {
  domains: string[],
  selectedDomain: string,
  onDomainChange(): any
}

export default class DomainMenu extends React.Component<IDomainMenu, void> {
  render() {
    return (
      <div>
        <DropDownMenu value={this.props.selectedDomain} onChange={this.props.onDomainChange}>
          { this.props.domains.map((domain) => {
            return <MenuItem value={domain} primaryText={domain} key={domain} />
          })}
        </DropDownMenu>
      </div>
    )
  }
}
