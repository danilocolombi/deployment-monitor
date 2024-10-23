/*
 * ---------------------------------------------------------
 * Copyright(C) Microsoft Corporation. All rights reserved.
 * ---------------------------------------------------------
 */

import { IVssRestClientOptions } from "azure-devops-extension-api";
import { RestClientBase } from "azure-devops-extension-api/Common/RestClientBase";
import { EnvironmentDeploymentRecord } from "./environment-deployment-record";
import { Environment } from "./environment";
import { Response } from "./response";

export class EnvironmentClient extends RestClientBase {
  constructor(options: IVssRestClientOptions) {
    super(options);
  }

  public async getAllEnvironments(
    project: string
  ): Promise<Response<Environment>> {
    return this.beginRequest<Response<Environment>>({
      apiVersion: "",
      routeTemplate: "{project}/_apis/pipelines/environments",
      routeValues: {
        project: project,
      },
    });
  }

  public async getAllDeploymentRecords(
    project: string,
    environmentId: number
  ): Promise<Response<EnvironmentDeploymentRecord>> {
    return this.beginRequest<Response<EnvironmentDeploymentRecord>>({
      apiVersion: "",
      queryParams: {
        top: 999
      },
      routeTemplate:
        "{project}/_apis/pipelines/environments/{environmentId}/environmentdeploymentrecords",
      routeValues: {
        project: project,
        environmentId: environmentId
      },
    });
  }
}