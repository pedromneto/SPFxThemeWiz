import * as React from 'react';
import { escape } from '@microsoft/sp-lodash-subset';
import reactCSS from 'reactcss';
import { SketchPicker } from 'react-color';
import { loadTheme, getTheme, ITheme, IPalette } from 'office-ui-fabric-react';
import { IPartialTheme } from '@uifabric/styling';
import { DefaultButton, Panel, PanelType, Slider, Checkbox } from 'office-ui-fabric-react';
import * as $ from 'jquery';
import { TinyColor } from '@ctrl/tinycolor';

export interface IThemeWizState {
  originalPalette: IPalette;
  newPalette: IPalette;
  activePicker: string;
  isPanelOpen: boolean;
  shouldSpreadColor: boolean;
  spreadFactor: number;
}

export default class ThemeWiz extends React.Component<{}, IThemeWizState> {
  private slider:any = null;

  constructor(props, state: IThemeWizState) {
    super(props, state);

    this.state = {
      originalPalette: null,
      newPalette: null,
      activePicker: '',
      isPanelOpen: false,
      shouldSpreadColor: false,
      spreadFactor: 10
    };
  }

  public componentWillMount() {
    let originalTheme: ITheme = getTheme(false);
    let theme:ITheme = getTheme(false);
    let currentTheme:any = window['__themeState__'].theme;
    Object.keys(theme.palette).forEach(element => {
      theme.palette[element] = currentTheme[element];
    });
    this.setState({ originalPalette: originalTheme.palette, newPalette: theme.palette });
  }

  public render(): React.ReactElement<{}> {
    const localStyles = reactCSS({
      'default': {
        color: {
          width: '36px',
          height: '14px',
          borderRadius: '2px'
        },
        swatch: {
          padding: '5px',
          background: '#fff',
          borderRadius: '1px',
          boxShadow: '0 0 0 1px rgba(0,0,0,.1)',
          display: 'inline-block',
          cursor: 'pointer',
        },
        popover: {
          position: 'absolute',
          zIndex: '2',
          left: '-215px',
          top: '-1px'
        },
        cover: {
          position: 'fixed',
          top: '0px',
          right: '0px',
          bottom: '0px',
          left: '0px',
        },
      },
    });

    const swatches: JSX.Element[] = Object.keys(this.state.newPalette).map((key:string) => {
      return(
        <div className={'ms-Grid-row'}>
          <div className={'ms-Grid-col ms-md8'}>{key}</div>
          <div className={'ms-Grid-col ms-md4'}>
            <div style={ localStyles.swatch } key={key} onClick={ this.handleClick(key) }>
              <div style={{width: '75px', height: '14px', borderRadius: '2px', backgroundColor: this.state.newPalette[key]}} />
            </div>
            { this.state.activePicker == key ? <div style={ localStyles.popover }>
              <div style={ localStyles.cover } onClick={ this.handleClose }/>
              <SketchPicker color={ this.state.newPalette[key] } onChangeComplete={ this.handleChangeComplete } onChange={ this.handleChange }  />
            </div> : null }
          </div>
        </div>
      );
    });

    return (
      <div>
        <DefaultButton secondaryText="Opens the Theme Wizard" onClick={this.onShowPanel} text="Open ThemeWiz" />
        <Panel
            isOpen={this.state.isPanelOpen}
            type={PanelType.smallFixedFar}
            onDismiss={this.onClosePanel}
            headerText="Theme Wizard"
            closeButtonAriaLabel="Close"
            isBlocking={false}
            isFooterAtBottom={true}
            onRenderFooterContent={this.onRenderFooterContent}
          >
          <div className={'ms-Grid'}>
            {swatches}
          </div>
        </Panel>
      </div>
    );
  }

  private onRenderFooterContent = (): JSX.Element => {
    //Format the JSON file
    let json:string = JSON.stringify(this.state.newPalette);
    json = json.replace(/{/g, '{\n\t');
    json = json.replace(/}/g, '\n}');
    json = json.replace(/,"/g, ',\n\t"');
    json = 'data:text/plain;base64,' + btoa(json);
    //Format the PowerShell file
    let ps:string = JSON.stringify(this.state.newPalette);
    ps = ps.replace(/}/g, ';}',);
    ps = ps.replace(/:/g, ' = ',);
    ps = ps.replace(/,"/g, ';\n\t"');
    ps = ps.replace(/{/g, '{\n\t');
    ps = ps.replace(/}/g, '\n}');
    ps = '$theme = @' + ps;
    ps = 'data:text/plain;base64,' + btoa(ps);

    return (
      <div>
        <Checkbox label='Spread theme colors from primary' onChange={(ev: React.FormEvent<HTMLElement>, isChecked: boolean): void => { this.setState({shouldSpreadColor: isChecked });}} />
        <br/>
        <Slider
            label="Spread amount"
            min={0}
            max={33}
            step={1}
            defaultValue={10}
            showValue={false}
            disabled={!this.state.shouldSpreadColor}
            onChange={(value: any) => {
              this.setState({spreadFactor: value});
            }}
          />
          <br/>
          <a href={json} download={'Theme.json'}>JSON</a>
          <br/>
          <a href={ps} download={'Theme.ps1'}>PowerShell</a>
          <br/>
          <br/>
        <DefaultButton onClick={this.onClosePanel}>Dismiss</DefaultButton>
      </div>
    );
  }

  private onClosePanel = () => {
    this.setState({ isPanelOpen: false });
  }

  private onShowPanel = () => {
    this.setState({ isPanelOpen: true });
  }

  private handleClick = (event) => {
    return ():void => {
      this.setState({ activePicker: event });
    };
  }

  private handleClose = () => {
    this.setState({ activePicker: '' });
  }

  private handleChange = (color) => {
    let palette: IPalette = this.state.newPalette;
    palette[this.state.activePicker] = color.hex;
    if(this.state.shouldSpreadColor && this.state.activePicker == 'themePrimary') {
      palette['themeDarkAlt'] = new TinyColor(color.hex).shade(this.state.spreadFactor).toHexString();
      palette['themeDark'] = new TinyColor(color.hex).shade(this.state.spreadFactor * 1.5).toHexString();
      palette['themeDarker'] = new TinyColor(color.hex).shade(this.state.spreadFactor * 2).toHexString();
      palette['themeLight'] = new TinyColor(color.hex).tint(this.state.spreadFactor).toHexString();
      palette['themeLighter'] = new TinyColor(color.hex).tint(this.state.spreadFactor * 2).toHexString();
      palette['themeLighterAlt'] = new TinyColor(color.hex).tint(this.state.spreadFactor * 3).toHexString();
    }
    this.setState({ newPalette: palette });
  }

  private handleChangeComplete = (color) => {
    let theme:IPartialTheme = {};
    theme.palette = this.state.newPalette;
    loadTheme(theme);
  }
}
