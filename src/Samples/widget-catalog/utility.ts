import * as SDK from 'azure-devops-extension-sdk';
import { CommonServiceIds, IProjectPageService,  getClient } from 'azure-devops-extension-api';
import { Build, BuildDefinition, BuildQueryOrder, BuildRestClient, BuildStatus } from 'azure-devops-extension-api/Build';
import { EnvironmentClient } from './EnvironmentClient';
import { Environment } from '../widget-configuration/Environment';
import { EnvironmentDeploymentRecord } from '../widget-configuration/EnvironmentDeploymentRecord';
import { EnvironmentDetail } from '../widget-configuration/EnvironmentDetail';

async function getCurrentProjectId(): Promise<string | undefined> {
  const pps = await SDK.getService<IProjectPageService>(
    CommonServiceIds.ProjectPageService
  );
  const project = await pps.getProject();
  return project?.id;
}

export async function getLastestBuild( pipelineId: number ): Promise<Build | undefined> {
  const projectId = await getCurrentProjectId();
  const builds = await getClient(BuildRestClient).getBuilds(
    projectId!, 
    [pipelineId],
    undefined,
    undefined,
    undefined,
    undefined,
    undefined,
    undefined,
    BuildStatus.Completed,
    undefined,
    undefined,
    undefined,
    1 /*top*/,
    undefined,
    undefined,
    undefined,
    BuildQueryOrder.StartTimeDescending,
    undefined,
    undefined,
    undefined,
    undefined
  );
  return builds.length > 0 ? builds[0] : undefined;
}

export async function getPipelineDefinition(pipelineId: number): Promise<BuildDefinition> {
  const projectId = await getCurrentProjectId();
  return await getClient(BuildRestClient).getDefinition(projectId!, pipelineId);
}

export async function getDeploymentRecords(): Promise<EnvironmentDetail[]> {
  const projectId = await getCurrentProjectId();
  const environments = await getClient(EnvironmentClient).getAllEnvironments(
    projectId!
  );

  console.log(environments);
  
  const environmentDetails: EnvironmentDetail[] = [];

  for(let i = 0; i < environments.length; i++) {
    const environment = environments[i];
    const deploymentRecords = await getClient(
      EnvironmentClient
    ).getAllDeploymentRecords(projectId!, environment.id);
    environmentDetails.push({
      name: environment.name,
      deploymentRecordCount: deploymentRecords.length ?? 0,
    });
  }

  console.log(environmentDetails);

  return environmentDetails;
}