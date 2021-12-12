import { chain, noop, Rule, SchematicContext, Tree } from '@angular-devkit/schematics';
import { NodePackageInstallTask } from '@angular-devkit/schematics/tasks';
import {
  addPackageJsonDependency,
  NodeDependency,
  NodeDependencyType
} from 'schematics-utilities';

function addPackageJsonDependencies(): Rule {
  return (host: Tree, context: SchematicContext) => {
    const dependencies: NodeDependency[] = [
      { type: NodeDependencyType.Default, version: '~3.0.0', name: '@senzing/rest-api-client-ng' },
      { type: NodeDependencyType.Default, version: '~3.0.0', name: '@senzing/sdk-graph-components' },
      { type: NodeDependencyType.Default, version: '~3.0.0', name: '@senzing/sdk-components-ng' }
    ];

    dependencies.forEach(dependency => {
      addPackageJsonDependency(host, dependency);
      context.logger.log('info', `Added "${dependency.name}" into ${dependency.type}`);
    });

    return host;
  };
}

/*
function getDependencyVersionFromPackageJson(packageName) {

}*/

function installPackageJsonDependencies(): Rule {
  return (host: Tree, context: SchematicContext) => {
    context.addTask(new NodePackageInstallTask());
    context.logger.log('info', `Installing packages...`);
    return host;
  };
}

export default function(options: any): Rule {
  installPackageJsonDependencies()
  return chain([
    options && options.skipPackageJson ? noop() : addPackageJsonDependencies(),
    options && options.skipPackageJson ? noop() : installPackageJsonDependencies()
  ]);
}

/*
// Just return the tree
export function ngAdd(options: any): Rule {
  return (tree: Tree, context: SchematicContext) => {
    context.addTask(new NodePackageInstallTask());
    return tree;
  };
}
*/
