/*
 * ---------------------------------------------------------
 * Copyright(C) Microsoft Corporation. All rights reserved.
 * ---------------------------------------------------------
 */

import { IVssRestClientOptions } from "azure-devops-extension-api";
import { RestClientBase } from "azure-devops-extension-api/Common/RestClientBase";
import { EnvironmentDeploymentRecord } from "./environment-deployment-record";
import { Environment } from "./environment";
import { PaginatedList } from "./paginated-list";

const msAjaxDateRegEx = new RegExp(
  '(^|[^\\\\])\\"\\\\/Date\\((-?[0-9]+)(?:[a-zA-Z]|(?:\\+|-)[0-9]{4})?\\)\\\\/\\"',
  "g"
);

export class EnvironmentClient extends RestClientBase {
  constructor(options: IVssRestClientOptions) {
    super(options);
  }

  public async getAllEnvironments(
    project: string
  ): Promise<PaginatedList<Environment>> {
    return this.beginRequest<Response>({
      apiVersion: "",
      routeTemplate: "{project}/_apis/pipelines/environments",
      routeValues: {
        project: project,
      },
      returnRawResponse: true,
    }).then(async (response) => {
      const body = <PaginatedList<Environment>>(
        await response.text().then(deserializeVssJsonObject)
      );
      body.continuationToken = response.headers.get("x-ms-continuationtoken");
      return body;
    });
  }

  public async getAllDeploymentRecords(
    project: string,
    environmentId: number,
    continuationToken?: string
  ): Promise<PaginatedList<EnvironmentDeploymentRecord>> {
    return this.beginRequest<Response>({
      apiVersion: "",
      queryParams: {
        top: 500,
        continuationToken: continuationToken,
      },
      returnRawResponse: true,
      routeTemplate:
        "{project}/_apis/pipelines/environments/{environmentId}/environmentdeploymentrecords",
      routeValues: {
        project: project,
        environmentId: environmentId,
      },
    }).then(async (response) => {
      const body = <PaginatedList<EnvironmentDeploymentRecord>>(
        await response.text().then(deserializeVssJsonObject)
      );
      body.continuationToken = response.headers.get("x-ms-continuationtoken");
      return body;
    });
  }
}

export function deserializeVssJsonObject<T>(text: string): T | null {
  function replaceMsJsonDates(
    object: any,
    parentObject: any,
    parentObjectKey: string
  ) {
    if (parentObject && typeof object.__msjson_date__ === "number") {
      parentObject[parentObjectKey] = new Date(object.__msjson_date__);
      return;
    }

    for (let key in object) {
      const value = object[key];
      if (value !== null && typeof value === "object") {
        replaceMsJsonDates(object[key], object, key);
      }
    }
  }

  let deserializedData: T | null = null;

  if (text) {
    // Replace MSJSON dates with an object that we can easily identify after JSON.parse.
    // This replaces the string value (like "\/Date(1496158224000)\/") with a JSON object that
    // has an "__msjson_date__" key.
    const replacedText = text.replace(
      msAjaxDateRegEx,
      '$1{"__msjson_date__":$2 }'
    );

    // Do the actual JSON deserialization
    deserializedData = JSON.parse(replacedText);

    // Go through the parsed object and create actual Date objects for our replacements made above
    if (replacedText !== text) {
      replaceMsJsonDates(deserializedData, null, "");
    }
  }

  return deserializedData;
}
