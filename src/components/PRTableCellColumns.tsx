import React from 'react';
import { SimpleTableCell, ITableColumn } from 'azure-devops-ui/Table';

import { PR } from '../state/types';
import { PRTableCellTitle } from './PRTableCellTitle';
import { sortByDisplayName } from '../lib/utils';
import { PRTableCellReviewers } from './PRTableCellReviewers';

export const titleColumn = (
  rowIndex: number,
  columnIndex: number,
  tableColumn: ITableColumn<PR>,
  tableItem: PR,
): JSX.Element => (
  <SimpleTableCell
    className="padding-8"
    key={'col-' + columnIndex}
    columnIndex={columnIndex}
    tableColumn={tableColumn}
    children={<PRTableCellTitle tableItem={tableItem} />}
  />
);

export const reviewersColumn = (
  rowIndex: number,
  columnIndex: number,
  tableColumn: ITableColumn<PR>,
  tableItem: PR,
): JSX.Element => {
  const reviewers = tableItem.reviewers.sort(sortByDisplayName);
  return (
    <SimpleTableCell
      className="bolt-table-cell-content-with-inline-link no-v-padding"
      key={'col-' + columnIndex}
      columnIndex={columnIndex}
      tableColumn={tableColumn}
      children={<PRTableCellReviewers reviewers={reviewers} />}
    />
  );
};
