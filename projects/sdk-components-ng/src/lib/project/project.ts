import {SzProjectInfo} from '../models/project/sz-project-info';
import {SzDataFile} from '../models/project/sz-data-file';
import {
  fromServer, toServer, fromServerArray, toServerArray
} from '../common/data-marshalling';
import { SzServerError} from '../common/server-error';

const projectDateFields = [ "createdOn", "lastModified", "repositoryLastModified" ];

export class SzProject implements SzProjectInfo {
  id: number;
  name: string;
  description: string;
  licenseRecordCount: number;
  createdOn: Date;
  lastModified: Date;
  repositoryLastModified: Date;
  upgraded: boolean;
  external: boolean;
  resolving: boolean;
  primingAudit: boolean;
  primingAuditSummary: boolean;
  files: SzDataFile[];
  recentErrors: SzServerError[];

  public static fromServer(source: any) : SzProject {
    const project = fromServer<SzProject>(new SzProject(), source, projectDateFields);
    if (!project) return project;

    if (project.files && project.files.length > 0) {
      project.files = SzDataFile.fromServerArray(project.files);
    }

    if (project.recentErrors && project.recentErrors.length > 0) {
      project.recentErrors= SzServerError.fromServerArray(project.recentErrors);
    }

    //project.external = true;
    return project;
  }

  public static fromServerArray(sourceArray: any[]) : SzProject[] {
    const projects = fromServerArray<SzProject>(
      <SzProject[]> [], sourceArray, () => new SzProject(), projectDateFields);

    projects.forEach(p => {
      //if (p) p.external = true;
      if (p && p.files && p.files.length > 0) {
        p.files = SzDataFile.fromServerArray(p.files);
      }
    });

    return projects;
  }

  public static toServer(source: SzProject|SzProjectInfo) : SzProject {
    const project = <SzProject> toServer<SzProjectInfo>(new SzProject(), source, projectDateFields);

    if (!project) return project;

    if (project.files && project.files.length > 0) {
      project.files = SzDataFile.toServerArray(project.files);
    }

    return project;
  }

  public static toServerArray(sourceArray: SzProject[]|SzProjectInfo[]) : SzProject[] {
    const projects = <SzProject[]> toServerArray<SzProjectInfo>(
      <SzProject[]> [], sourceArray, () => new SzProject(), projectDateFields);

    if (!projects) return projects;

    projects.forEach(p => {
      if (p && p.files && p.files.length > 0) {
        p.files = SzDataFile.toServerArray(p.files);
      }
    });

    return projects;
  }
}
