/*
 * ---------------------------------------------------------
 * Copyright(C) Microsoft Corporation. All rights reserved.
 * ---------------------------------------------------------
 */

import { IVssRestClientOptions } from "azure-devops-extension-api";
import { RestClientBase } from "azure-devops-extension-api/Common/RestClientBase";
import { Environment } from "../widget-configuration/Environment";
import { EnvironmentDeploymentRecord } from "../widget-configuration/EnvironmentDeploymentRecord";

export class EnvironmentClient extends RestClientBase {
  constructor(options: IVssRestClientOptions) {
    super(options);
  }

  public async getAllEnvironments(project: string): Promise<Environment[]> {
    return this.beginRequest<Environment[]>({
      apiVersion: "7.2-preview.1",
      routeTemplate: "{project}/_apis/pipelines/environments",
      routeValues: {
        project: project,
      },
    });
  }

  public async getAllDeploymentRecords(project: string, environmentId: number): Promise<EnvironmentDeploymentRecord[]> {
    return this.beginRequest<EnvironmentDeploymentRecord[]>({
      apiVersion: "7.2-preview.1",
      routeTemplate:
        "{project}/_apis/pipelines/environments/{environmentId}/environmentdeploymentrecords",
      routeValues: {
        project: project,
        environmentId: environmentId,
      },
    });
  }
}