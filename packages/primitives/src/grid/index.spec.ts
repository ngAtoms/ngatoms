/**
 * @file Pins the public surface of the grid. Adding or removing an export
 * in index.ts fails here, so the change shows in the diff of this list.
 */

import ts from 'typescript';
import { describe, expect, it } from 'vitest';

const PUBLIC_EXPORTS = [
  'GridBatchRejection',
  'GridCellChange',
  'GridCellPosition',
  'GridCellRange',
  'GridCellRect',
  'GridCellRejection',
  'GridCellResolver',
  'GridCellState',
  'GridCellTarget',
  'GridCellValue',
  'GridColumn',
  'GridColumnGroup',
  'GridColumnNode',
  'GridColumnPin',
  'GridColumnType',
  'GridCustomFilter',
  'GridDropPosition',
  'GridExportOptions',
  'GridFilter',
  'GridFilterType',
  'GridFilters',
  'GridIndexRange',
  'GridMove',
  'GridNumberFilter',
  'GridNumberFormat',
  'GridNumberOperator',
  'GridRow',
  'GridRowId',
  'GridRowKind',
  'GridRowMove',
  'GridSelection',
  'GridSetFilter',
  'GridSort',
  'GridTextFilter',
  'GridTextOperator',
  'NgAtomsGridCellContext',
  'NgAtomsGridCellDirective',
  'NgAtomsGridCellStateFn',
  'NgAtomsGridComponent',
  'NgAtomsGridDataMode',
  'NgAtomsGridDensity',
  'NgAtomsGridEditorContext',
  'NgAtomsGridEditorDirective',
  'NgAtomsGridExportOptions',
  'fillDownChanges',
  'fillFromChanges',
  'isColumnGroup',
];

/** The barrel's exported symbols, with the checker that resolved them. */
function barrel(file: string): { checker: ts.TypeChecker; exports: ts.Symbol[] } {
  const program = ts.createProgram([file], {
    target: ts.ScriptTarget.ES2022,
    module: ts.ModuleKind.ESNext,
    moduleResolution: ts.ModuleResolutionKind.Bundler,
    experimentalDecorators: true,
    skipLibCheck: true,
    noEmit: true,
  });
  const checker = program.getTypeChecker();
  const source = program.getSourceFile(file);
  if (!source) throw new Error(`cannot read ${file}`);
  const module = checker.getSymbolAtLocation(source);
  if (!module) throw new Error(`${file} is not a module`);
  return { checker, exports: checker.getExportsOfModule(module) };
}

function exportedNames(file: string): string[] {
  return barrel(file).exports.map(symbol => symbol.name).sort();
}

/** Angular signal APIs whose type arguments are a component's public surface. */
const SIGNAL_APIS = new Set(['input', 'output', 'model']);

/**
 * The parts of a declaration an app can name: all of a type, interface or
 * function, and for a class only its inputs, outputs and models.
 */
function publicParts(declaration: ts.Declaration): ts.Node[] {
  if (!ts.isClassDeclaration(declaration)) return [declaration];
  return declaration.members.flatMap(member => {
    if (!ts.isPropertyDeclaration(member) || !member.initializer || !ts.isCallExpression(member.initializer)) return [];
    const callee = member.initializer.expression;
    const api = ts.isPropertyAccessExpression(callee) ? callee.expression : callee;
    return ts.isIdentifier(api) && SIGNAL_APIS.has(api.text) ? [...(member.initializer.typeArguments ?? [])] : [];
  });
}

/** `Export -> Type` for each grid type a public signature names but the barrel does not export. */
function unexportedReferences(file: string): string[] {
  const { checker, exports } = barrel(file);
  const exported = new Set(exports.map(symbol => symbol.name));
  const found = new Set<string>();
  for (const symbol of exports) {
    const target = symbol.flags & ts.SymbolFlags.Alias ? checker.getAliasedSymbol(symbol) : symbol;
    for (const declaration of target.declarations ?? []) {
      const visit = (node: ts.Node): void => {
        const name = ts.isTypeReferenceNode(node)
          ? node.typeName
          : ts.isExpressionWithTypeArguments(node)
            ? node.expression
            : null;
        if (name) {
          let referenced = checker.getSymbolAtLocation(name);
          if (referenced && referenced.flags & ts.SymbolFlags.Alias) referenced = checker.getAliasedSymbol(referenced);
          const source = referenced?.declarations?.[0]?.getSourceFile().fileName ?? '';
          const isGrid = /\/src\/grid(-core)?\//.test(source);
          if (referenced && isGrid && !(referenced.flags & ts.SymbolFlags.TypeParameter) && !exported.has(referenced.name)) {
            found.add(`${symbol.name} -> ${referenced.name}`);
          }
        }
        ts.forEachChild(node, visit);
      };
      publicParts(declaration).forEach(visit);
    }
  }
  return [...found].sort();
}

/** The barrel, from the repo root (ng test) or the package (npm test). */
function indexFile(): string {
  const cwd = ts.sys.getCurrentDirectory();
  const file = ['packages/primitives/src/grid/index.ts', 'src/grid/index.ts']
    .map(path => `${cwd}/${path}`)
    .find(path => ts.sys.fileExists(path));
  if (!file) throw new Error(`grid/index.ts not found from ${cwd}`);
  return file;
}

describe('grid public exports', () => {
  it('match the reviewed list', () => {
    expect(exportedNames(indexFile())).toEqual([...PUBLIC_EXPORTS].sort());
  });

  it('keep the grid internals out', () => {
    const names = exportedNames(indexFile());
    for (const internal of ['NGA_GRID', 'NgAtomsGridContext', 'GridCellView', 'buildOffsets', 'indexAtOffset', 'moveForKey']) {
      expect(names).not.toContain(internal);
    }
  });

  it('export every grid type a public signature names', () => {
    expect(unexportedReferences(indexFile())).toEqual([]);
  });
});
