import React from 'react';
import Radium from 'radium';
import tinycolor from 'tinycolor2';
import Styles from '../styles';

import { inBetween, inBetweenArea, isEqualObject } from './helper';

@Radium
class Cell extends React.Component {

  /*
    Lifecycle
   */
  constructor (props) {
    super(props);
    this.state = {
      data: props.data
    };

  }

  componentWillReceiveProps (nextProps) {
    const startingEdit = (!this.props.editing && nextProps.editing);
    if (startingEdit){
      this.setState({
        data: nextProps.data
      }, () => {
        this._focusInput();
      });
    }
  }

  /**
   * Internal Methods
   */
  _focusInput = () => {
    const node = React.findDOMNode(this.refs.input);
    if (node){
      node.focus();
      node.setSelectionRange(0, node.value.length);
    }
  }

  _commitEdit = () => {
    this.props.onUpdate(this.state.data);
  }

  _revert = () => {
    this.setState({data: this.props.data}, () => {
      this.props.onUpdate(this.props.data, false);
    });
  }

  _getEdges (sel, selected, focused, rowIndex, columnIndex) {
    return {
      left: selected && this.props.isLeft || focused,
      right: selected && this.props.isRight || focused,
      top: selected && this.props.isTop || focused,
      bottom: selected && this.props.isBottom || focused
    };
  }

  /**
   * Handlers
   */
  _handleKeyUp = (e) => {
    if (e.key === 'Enter') {
      this._commitEdit();
    } else if (e.key === 'Escape'){
      this._revert();
    }
  }

  _handleChange = (e) => {
    this.setState({ data: e.target.value });
  }

  _handleOptions = (e) => {
    this.props.onUpdate(e.target.value, false);
  }

  _handleOptionsClick = (e) => {
    React.findDOMNode(this.refs.select).click();
  }

  _handleSelect = (hover) => {
    this.setState({ hoverOptions: hover });
  }


  /*
    Render
   */
  _getOptions () {
    const options = this.props.column.options.map((option, i) => {
      return (
        <option
          key={option}
          value={option}>
          {option}
        </option>
      );
    });

    options.unshift(<option key=' ' value=' ' disabled>Choose below</option>);
    return options;
  }

  _getSelect () {
    if (this.props.column.options){
      return (
        <div style={ [Styles.Unselectable] }>
          <div
            style={ [Styles.Cell.arrow, this.state.hoverOptions ? {opacity: 0.5} : null] }>▼</div>
          <select
            ref='select'
            style={ [Styles.Cell.select] }
            value={' '}
            onChange={ this._handleOptions }
            onMouseEnter={ this._handleSelect.bind(this, true) }
            onMouseLeave={ this._handleSelect.bind(this, false) } >
            { this._getOptions() }
          </select>
        </div>
      );
    }
  }

  getStyle () {
    const sel = this.props.selection;
    const editing = this.props.editing;
    const focused = this.props.focused;
    const selected = this.props.selected;
    const hasPrevRow = this.props.hasPrevRow;
    const hasPrevColumn = this.props.hasPrevColumn;
    const error = this.props.error;
    const rowIndex = this.props.rowIndex;
    const columnIndex = this.props.columnIndex;

    const styles = [Styles.Cell.input];

    if (!editing) {
      styles.push({pointerEvents: 'none'});
    }

    //  Background color
    const highlightFactor = Styles.Colors.highlightFactor;
    if (selected && error) {
      styles.push({ background: tinycolor
                                .mix(tinycolor(Styles.Colors.danger), tinycolor(Styles.Colors.primary), 30)
                                .setAlpha(highlightFactor).toRgbString() });
    } else if (error) {
      styles.push({ background: tinycolor(Styles.Colors.danger).setAlpha(highlightFactor).toRgbString() });
    } else if (selected) {
      styles.push({ background: tinycolor(Styles.Colors.primary).setAlpha(highlightFactor).toRgbString() });
    }

    //  Edges
    const edges = this._getEdges(sel, selected, focused, rowIndex, columnIndex);
    const px = focused ? 2 : 1;
    const color = Styles.Colors.primary;

    if (edges.left){
      styles.push({paddingLeft: (6 + 1 - px) + 'px', borderLeftWidth: px + 'px', borderLeftColor: color});
    }
    if (edges.right){
      styles.push({paddingRight: (6 - px) + 'px', borderRightWidth: px + 'px', borderRightColor: color});
    }
    if (edges.top){
      styles.push({paddingTop: (4 + 1 - px) + 'px', borderTopWidth: px + 'px', borderTopColor: color});
    }
    if (edges.bottom){
      styles.push({paddingBottom: (4 - px) + 'px', borderBottomWidth: px + 'px', borderBottomColor: color});
    }

    //  Previous edges
    if (hasPrevRow){
      styles.push({paddingTop: (4 + 1) + 'px', borderTopWidth: 0 + 'px'});
    }
    if (hasPrevColumn){
      styles.push({paddingLeft: (6 + 1) + 'px', borderLeftWidth: 0 + 'px'});
    }

    //  Final style before customisation
    return this.props.getStyle ?
      this.props.getStyle(this.props.data,
                          this.props.rowData,
                          this.props.column,
                          { selected, focused, editing, error, selection: sel },
                          styles)
      : styles;
  }


  /**
   * Rendering
   */
  shouldComponentUpdate (nextProps, nextState) {
    //return true;
    const ignoreKeys = {selection: true};
    if (!isEqualObject(this.props, nextProps, ignoreKeys) ||
        !isEqualObject(this.state, nextState)){
      return true;
    }
    return false;
  }

  componentDidUpdate () {
    const input = React.findDOMNode(this.refs.input);
    if (!this.props.editing && input === document.activeElement){
      input.blur();
    }
  }

  render () {
    return (
      <div
        style={ [Styles.Stretch, Styles.Unselectable] }
        onMouseDown={ this.props.onMouseDown }
        onMouseOver={ this.props.onMouseOver } >
        <input
          ref='input'
          type='text'
          style={ this.getStyle() }
          value={ this.props.editing ? this.state.data : this.props.data}
          onKeyUp={ this._handleKeyUp }
          onChange={ this._handleChange}
          onBlur={ this._commitEdit } />
        { this._getSelect() }
      </div>
    );
  }
}

Cell.propTypes = {
  data: React.PropTypes.any,
  rowData: React.PropTypes.object,
  selected: React.PropTypes.bool,
  focused: React.PropTypes.bool,
  hasPrevRow: React.PropTypes.bool,
  hasPrevColumn: React.PropTypes.bool,
  isLeft: React.PropTypes.bool,
  isRight: React.PropTypes.bool,
  isTop: React.PropTypes.bool,
  isBottom: React.PropTypes.bool,
  editing: React.PropTypes.bool,
  error: React.PropTypes.string,

  column: React.PropTypes.shape({
    options: React.PropTypes.array
  }),
  selection: React.PropTypes.shape({
    startRow: React.PropTypes.number,
    endRow: React.PropTypes.number,
    startCol: React.PropTypes.number,
    endCol: React.PropTypes.number
  }),
  rowIndex: React.PropTypes.number,
  columnIndex: React.PropTypes.number,

  getStyle: React.PropTypes.func,
  onUpdate: React.PropTypes.func.isRequired,

  onMouseDown: React.PropTypes.func,
  onMouseOver: React.PropTypes.func
};

export default Cell;