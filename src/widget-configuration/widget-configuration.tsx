import "./widget-configuration.scss";
import * as React from "react";
import * as SDK from "azure-devops-extension-sdk";
import * as Dashboard from "azure-devops-extension-api/Dashboard";
import { getAllEnvironments } from "../deployment-monitor-widget/utility";
import { Environment } from "../deployment-monitor-widget/environment";
import { IListBoxItem } from "azure-devops-ui/ListBox";
import { Dropdown } from "azure-devops-ui/Dropdown";
import { DropdownMultiSelection } from "azure-devops-ui/Utilities/DropdownSelection";
import { showRootComponent } from "../root";
import { Observer } from "azure-devops-ui/Observer";
import { IDeploymentMonitorWidgetSettings } from "./settings";

interface ISampleWidgetConfigState {
  environments: Environment[];
  selectedEnvironments: Environment[];
}

class SampleWidgetConfig
  extends React.Component<{}, ISampleWidgetConfigState>
  implements Dashboard.IWidgetConfiguration {
  private widgetConfigurationContext?: Dashboard.IWidgetConfigurationContext;
  private settings: IDeploymentMonitorWidgetSettings = {} as IDeploymentMonitorWidgetSettings;
  private environmentsSelection = new DropdownMultiSelection();

  componentDidMount() {
    SDK.init().then(() => {
      SDK.register("deployment-widget.config", this);
      SDK.resize(400, 200);
    });
  }

  render(): JSX.Element {

    if (!this.state) {
      return <div></div>;
    }

    const { environments, selectedEnvironments } = this.state;

    const environmentListItems: IListBoxItem<{}>[] = environments.map((environment, index) => {
      if (selectedEnvironments?.some((selectedEnv) => selectedEnv.id === environment.id)) {
        this.environmentsSelection.select(index);
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

              <Observer selection={this.onSelectMultiple}>
                {() => {
                  return (
                    <Dropdown
                      ariaLabel="Multiselect"
                      actions={[
                        {
                          className: "bolt-dropdown-action-right-button",
                          disabled: this.environmentsSelection.selectedCount === 0,
                          iconProps: { iconName: "Clear" },
                          text: "Clear",
                          onClick: () => {
                            this.clearSelection();
                          }
                        },
                      ]}
                      items={environmentListItems}
                      selection={this.environmentsSelection}
                      placeholder="Select projects"
                      showFilterBox={true}
                      onSelect={this.onSelectMultiple}
                    />
                  );
                }}
              </Observer>
            </div>
          </div>
        </div>
      )
    );
  }

  private onSelectMultiple = (event: React.SyntheticEvent<HTMLElement>, item: IListBoxItem<{}>) => {
    const { selectedEnvironments, environments } = this.state;
    const selectedOption = environments.find(env => env.id === Number(item.id));

    if (selectedOption === undefined) {
      return;
    }

    if (selectedEnvironments === undefined) {
      this.updateSelectedEnvironments([selectedOption]);
      return;
    }

    if (selectedEnvironments.some((environment => environment.id === selectedOption.id))) {
      this.updateSelectedEnvironments(selectedEnvironments.filter((environment) => environment.id !== selectedOption.id));
    }
    else {
      this.updateSelectedEnvironments([...selectedEnvironments, selectedOption]);
    }
  };

  private clearSelection = () => {
    this.environmentsSelection.clear();
    const partialState = { selectedEnvironments: [] };
    this.updateSettingsAndNotify(partialState);
    this.setState({ ...this.state, ...partialState });
  };

  private updateSelectedEnvironments(selectedEnvironments: Environment[]) {
    this.updateSettingsAndNotify({ selectedEnvironments });
    this.setState({ ...this.state, selectedEnvironments });
  }

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
    
    const environments = await getAllEnvironments();

    if (deserialized === undefined || deserialized?.selectedEnvironments === undefined) {
      this.setState({ environments });
      return;
    }

    this.settings = deserialized;

    this.setState({ ...deserialized, environments });
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
    if (!(await this.validateSettings())) {
      return Dashboard.WidgetConfigurationSave.Invalid();
    }
    return Dashboard.WidgetConfigurationSave.Valid(
      this.serializeWidgetSettings(this.settings)
    );
  }
}

showRootComponent(<SampleWidgetConfig />);
