import "./deployment-monitor-widget.scss";
import * as React from "react";
import * as SDK from "azure-devops-extension-sdk";
import * as Dashboard from "azure-devops-extension-api/Dashboard";
import { Card } from "azure-devops-ui/Card";
import {
  ColumnSorting,
  ISimpleTableCell,
  ITableColumn,
  renderSimpleCell,
  sortItems,
  SortOrder,
  Table,
} from "azure-devops-ui/Table";
import { ObservableValue } from "azure-devops-ui/Core/Observable";
import { ArrayItemProvider } from "azure-devops-ui/Utilities/Provider";
import { Observer } from "azure-devops-ui/Observer";
import { EnvironmentDetails } from "./environment-details";
import { getDeploymentRecords } from "./utility";
import { showRootComponent } from "../root";

interface IDeploymentMonitorWidgetState {
  title: string;
  environmentDetails: EnvironmentDetails[];
}

class DeploymentMonitorWidget extends React.Component<{}, IDeploymentMonitorWidgetState> implements Dashboard.IConfigurableWidget {

  componentDidMount() {
    SDK.init().then(() => {
      SDK.register("deployments-widget", this);
    });
  }

  render(): JSX.Element {
    if (!this.state) {
      return <div></div>;
    }

    const { title, environmentDetails } = this.state;

    const rawTableItems: ITableItem[] = environmentDetails.map(environmentDetail => ({
      name: environmentDetail.name,
      deploymentCount: environmentDetail.deploymentRecordCount,
    }));

    const sortingBehavior = new ColumnSorting<ITableItem>(
      (columnIndex: number, proposedSortOrder: SortOrder) => {
        itemProvider.value = new ArrayItemProvider(
          sortItems(
            columnIndex,
            proposedSortOrder,
            sortFunctions,
            columns,
            rawTableItems
          )
        );
      }
    );

    const sortFunctions = [
      (item1: ITableItem, item2: ITableItem): number => {
        return item1.name.localeCompare(item2.name);
      },
      (item1: ITableItem, item2: ITableItem): number => {
        return item1.deploymentCount - item2.deploymentCount;
      }
    ];

    const itemProvider = new ObservableValue<ArrayItemProvider<ITableItem>>(
      new ArrayItemProvider(rawTableItems)
    );

    return (
      this.state && <Card className="flex-grow bolt-table-card" titleProps={{ text: title, ariaLevel: 3 }}>
        <Observer itemProvider={itemProvider}>
          {(observableProps: { itemProvider: ArrayItemProvider<ITableItem> }) => (
            <Table<ITableItem>
              ariaLabel="Pipelines Table"
              columns={columns}
              behaviors={[sortingBehavior]}
              itemProvider={observableProps.itemProvider}
              scrollable={true}
              role="table"
              pageSize={100}
              containerClassName="h-scroll-auto"
            />
          )}
        </Observer>
      </Card>
    );
  }

  async preload(_widgetSettings: Dashboard.WidgetSettings) {
    return Dashboard.WidgetStatusHelper.Success();
  }

  async load(widgetSettings: Dashboard.WidgetSettings): Promise<Dashboard.WidgetStatus> {
    try {
      await this.setStateFromWidgetSettings(widgetSettings);
      return Dashboard.WidgetStatusHelper.Success();
    } catch (e) {
      return Dashboard.WidgetStatusHelper.Failure((e as any).toString());
    }
  }

  async reload(widgetSettings: Dashboard.WidgetSettings): Promise<Dashboard.WidgetStatus> {
    try {
      await this.setStateFromWidgetSettings(widgetSettings);
      return Dashboard.WidgetStatusHelper.Success();
    } catch (e) {
      return Dashboard.WidgetStatusHelper.Failure((e as any).toString());
    }
  }

  private async setStateFromWidgetSettings(widgetSettings: Dashboard.WidgetSettings) {
    try {
      const deserialized: IDeploymentMonitorWidgetSettings = JSON.parse(
        widgetSettings.customSettings.data
      ) ?? {};

      const environmentDetails = await getDeploymentRecords(deserialized.selectedEnvironment);

      this.setState({ ...deserialized, title: widgetSettings.name, environmentDetails });

    } catch (e) {
      console.log(e);
    }
  }
}

showRootComponent(<DeploymentMonitorWidget />);

export interface ITableItem extends ISimpleTableCell {
  name: string;
  deploymentCount: number;
}

const columns: ITableColumn<ITableItem>[] = [
  {
    id: "name",
    name: "Pipeline Name",
    readonly: true,
    renderCell: renderSimpleCell,
    sortProps: {
      ariaLabelAscending: "Sorted A to Z",
      ariaLabelDescending: "Sorted Z to A",
    },
    width: new ObservableValue(-70),
  },
  {
    id: "deploymentCount",
    maxWidth: 300,
    name: "Deployment Records Count",
    readonly: true,
    renderCell: renderSimpleCell,
    sortProps: {
      ariaLabelAscending: "Sorted low to high",
      ariaLabelDescending: "Sorted high to low",
    },
    width: new ObservableValue(-30),
  }
];

