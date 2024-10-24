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
  SimpleTableCell,
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
import { IDeploymentMonitorWidgetSettings } from "../widget-configuration/settings";
import { Link } from "azure-devops-ui/Link";

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
      deploymentFrequency: environmentDetail.deploymentFrequency,
      pipelineUrl: environmentDetail.pipelineUrl,
      average: environmentDetail.average,
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
      },
      (item1: ITableItem, item2: ITableItem): number => {
        return item1.average - item2.average;
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

      const environmentDetails = await getDeploymentRecords(deserialized.selectedEnvironments);

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
  deploymentFrequency: string;
  pipelineUrl: string;
  average: number;
}

const columns: ITableColumn<ITableItem>[] = [
  {
    id: "name",
    name: "Pipeline Name",
    renderCell: renderPipelineNameCell,
    sortProps: {
      ariaLabelAscending: "Sorted A to Z",
      ariaLabelDescending: "Sorted Z to A",
    },
    width: -30,
  },
  {
    id: "deploymentCount",
    name: "Deployment Count",
    renderCell: renderSimpleCell,
    sortProps: {
      ariaLabelAscending: "Sorted low to high",
      ariaLabelDescending: "Sorted high to low",
    },
    width: -20,
  },
  {
    id: "average",
    name: "Average (days)",
    renderCell: renderSimpleCell,
    sortProps: {
      ariaLabelAscending: "Sorted low to high",
      ariaLabelDescending: "Sorted high to low",
    },
    width: -20,
  },
  {
    id: "deploymentFrequency",
    name: "Frequency",
    renderCell: renderSimpleCell,
    sortProps: {
      ariaLabelAscending: "Sorted A to Z",
      ariaLabelDescending: "Sorted Z to A",
    },
    width: new ObservableValue(-30),
  },
];
function renderPipelineNameCell(
  rowIndex: number,
  columnIndex: number,
  tableColumn: ITableColumn<ITableItem>,
  tableItem: ITableItem
): JSX.Element {
  const item = tableItem;
  return (
    <SimpleTableCell
      columnIndex={columnIndex}
      tableColumn={tableColumn}
      key={"col-" + columnIndex}
    >
      <span className="flex-row wrap-text">
        <Link
          className="bolt-table-link bolt-link no-underline-link text-ellipsis small-margin bolt-link"
          href={item.pipelineUrl}
          target="_blank"
        >
          {item.name}
        </Link>
      </span>
    </SimpleTableCell>
  );
}

