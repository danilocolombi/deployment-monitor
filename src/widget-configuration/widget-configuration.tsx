import "./widget-configuration.scss";
import * as React from "react";
import * as SDK from "azure-devops-extension-sdk";
import * as Dashboard from "azure-devops-extension-api/Dashboard";
import { getAllEnvironments } from "../deployment-monitor-widget/utility";
import { Environment } from "../deployment-monitor-widget/environment";
import { IListBoxItem } from "azure-devops-ui/ListBox";
import { Dropdown } from "azure-devops-ui/Dropdown";
import { DropdownSelection } from "azure-devops-ui/Utilities/DropdownSelection";
import { showRootComponent } from "../common";

interface ISampleWidgetConfigState {
  environments: Environment[];
  selectedEnvironment: number;
}

class SampleWidgetConfig
  extends React.Component<{}, ISampleWidgetConfigState>
  implements Dashboard.IWidgetConfiguration {
  private widgetConfigurationContext?: Dashboard.IWidgetConfigurationContext;
  private settings: IDeploymentMonitorWidgetSettings = {} as IDeploymentMonitorWidgetSettings;
  private scopeSelection = new DropdownSelection();

  componentDidMount() {
    SDK.init().then(() => {
      SDK.register("sample-widget.config", this);
      SDK.resize(400, 200);
    });
  }

  render(): JSX.Element {

    if (!this.state) {
      return <div></div>;
    }

    const { environments, selectedEnvironment } = this.state;

    console.log(selectedEnvironment);

    const environmentListItems: IListBoxItem<{}>[] = environments.map((environment, index) => {
      if (selectedEnvironment === environment.id) {
        this.scopeSelection.select(index);
      }
      return {
        id: String(environment.id),
        text: environment.name,
      };
    });

    return (
      this.state && (
        <div className="content">
          <div className="flex-column">
            <label className="select-label">Scope</label>
            <div className="flex-column">
              <Dropdown
                ariaLabel="Basic"
                items={environmentListItems}
                selection={this.scopeSelection}
                onSelect={this.onSelect}
              />
            </div>
          </div>
        </div>
      )
    );
  }

  private onSelect = (event: React.SyntheticEvent<HTMLElement>, item: IListBoxItem<{}>) => {
    const value = item.id;
    const partialState = { selectedEnvironment: Number(value) };

    this.updateSettingsAndNotify(partialState);
    this.setState({ ...this.state, ...partialState });
  };

  private async updateSettingsAndNotify(
    partialSettings: Partial<IDeploymentMonitorWidgetSettings>
  ) {
    this.settings = { ...this.settings, ...partialSettings };
    const customSettings = this.serializeWidgetSettings(this.settings);
    await this.widgetConfigurationContext?.notify(
      Dashboard.ConfigurationEvent.ConfigurationChange,
      Dashboard.ConfigurationEvent.Args(customSettings)
    );
  }

  private serializeWidgetSettings(
    settings: IDeploymentMonitorWidgetSettings
  ): Dashboard.CustomSettings {
    return {
      data: JSON.stringify(settings),
      version: { major: 1, minor: 0, patch: 0 },
    };
  }

  private async setStateFromWidgetSettings(
    widgetSettings: Dashboard.WidgetSettings
  ) {
    const deserialized: IDeploymentMonitorWidgetSettings | null = JSON.parse(
      widgetSettings.customSettings.data
    )

    if (deserialized) {
      this.settings = deserialized;
    }

    const environments = await getAllEnvironments();
    const selectedEnvironment = Number(deserialized?.selectedEnvironment) ?? environments[0].id;

    this.setState({ selectedEnvironment, environments: environments });
  }

  private async validateSettings(): Promise<boolean> {

    return true;
  }

  async load(widgetSettings: Dashboard.WidgetSettings, widgetConfigurationContext: Dashboard.IWidgetConfigurationContext): Promise<Dashboard.WidgetStatus> {
    this.widgetConfigurationContext = widgetConfigurationContext;

    await this.setStateFromWidgetSettings(widgetSettings);
    return Dashboard.WidgetStatusHelper.Success();
  }

  async onSave(): Promise<Dashboard.SaveStatus> {
    // ensure new settings values are valid; set error state for the UI at the same time
    if (!(await this.validateSettings())) {
      return Dashboard.WidgetConfigurationSave.Invalid();
    }
    // persist new settings
    return Dashboard.WidgetConfigurationSave.Valid(
      this.serializeWidgetSettings(this.settings)
    );
  }
}

showRootComponent(<SampleWidgetConfig />);
