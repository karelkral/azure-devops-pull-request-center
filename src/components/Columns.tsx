import React from 'react';
import { Pill } from 'azure-devops-ui/Pill';
import { Tooltip } from 'azure-devops-ui/TooltipEx';
import { PillGroup } from 'azure-devops-ui/PillGroup';
import { VssPersona } from 'azure-devops-ui/VssPersona';
import { SimpleTableCell, ITableColumn } from 'azure-devops-ui/Table';
import { IdentityRefWithVote } from 'azure-devops-extension-api/Git/Git';

import './Columns.scss';
import { PR } from '../state/types';
import { ReviewerVoteOption } from '../lib/enums';
import { sortByDisplayName } from '../lib/utilities';
import { PullRequestCellUI } from './PullRequestCellUI';
import { getReviewerVoteIconStatus } from './StatusIcon';
import { reviewerVoteToIColorLight } from '../lib/colors';

export const renderTitleColumn = (
  rowIndex: number,
  columnIndex: number,
  tableColumn: ITableColumn<PR>,
  tableItem: PR
): JSX.Element => (
  <SimpleTableCell
    className='padding-8'
    key={'col-' + columnIndex}
    columnIndex={columnIndex}
    tableColumn={tableColumn}
    children={<PullRequestCellUI tableItem={tableItem} />}
  />
);

export const renderReviewersColumn = (
  rowIndex: number,
  columnIndex: number,
  tableColumn: ITableColumn<PR>,
  tableItem: PR
): JSX.Element => {
  const reviewers = tableItem.reviewers.sort(sortByDisplayName);
  return (
    <SimpleTableCell
      className='bolt-table-cell-content-with-inline-link no-v-padding'
      key={'col-' + columnIndex}
      columnIndex={columnIndex}
      tableColumn={tableColumn}
      children={<ReviewersCell reviewers={reviewers} />}
    />
  );
};

type Reviewer = {
  id: number;
  element: JSX.Element;
  elementWidth: number;
};
interface ReviewersCellProps {
  reviewers: IdentityRefWithVote[];
}
const ReviewersCell: React.FC<ReviewersCellProps> = ({ reviewers }: ReviewersCellProps) => {
  const [width, setWidth] = React.useState(0);
  const [pills, setPills] = React.useState<Reviewer[]>([]);
  const [displayPills, setDisplayPills] = React.useState<Reviewer[]>([]);
  const [overflowPills, setOverflowPills] = React.useState<Reviewer[]>([]);
  const [breakpointPillId, setBreakpointPillId] = React.useState(0);
  const BREAKPOINT_WIDTH = 600;

  React.useEffect(() => {
    let breakpointHit = false;
    setWidth(
      pills.reduce((acc, cur) => {
        const newSum = acc + cur.elementWidth;
        if (newSum > BREAKPOINT_WIDTH && !breakpointHit) {
          setBreakpointPillId(cur.id);
          breakpointHit = true;
        }
        return newSum;
      }, 0)
    );
  }, [pills]);

  React.useEffect(() => {
    const noOverflowRequired = pills.length > 0 && width > 0 && width < BREAKPOINT_WIDTH;
    if (noOverflowRequired) {
      setDisplayPills(pills);
    }

    const overflowRequired = pills.length > 0 && width > BREAKPOINT_WIDTH;
    if (overflowRequired) {
      setDisplayPills(pills.slice(0, breakpointPillId));
      setOverflowPills(pills.slice(breakpointPillId));
    }
  }, [pills, breakpointPillId, width]);

  return (
    <>
      {reviewers.map((reviewer, index) => (
        <CalculatePillWidth key={index} reviewer={reviewer} index={index} setPills={setPills} />
      ))}
      <PillGroup overflow={1}>
        {displayPills.map(p => p.element)}
        {width > BREAKPOINT_WIDTH && (
          <Tooltip
            className='tooltip-overflow'
            renderContent={() => (
              <div className='tooltip-overflow-parent'>
                {overflowPills.map(p => (
                  <div key={p.id} className='tooltip-overflow-child'>
                    {p.element}
                  </div>
                ))}
              </div>
            )}
          >
            <Pill key={`overflow-pill`} variant={2} size={1}>
              <span style={{ fontWeight: 'bold' }}>+{overflowPills.length}</span>
            </Pill>
          </Tooltip>
        )}
      </PillGroup>
    </>
  );
};

interface CalculatePillWidthProps {
  reviewer: IdentityRefWithVote;
  index: number;
  setPills: React.Dispatch<React.SetStateAction<Reviewer[]>>;
}
const CalculatePillWidth: React.FC<CalculatePillWidthProps> = ({
  reviewer,
  index,
  setPills
}: CalculatePillWidthProps) => {
  const [innerWidth, setInnerWidth] = React.useState(0);
  const reviewerRef = React.useRef<HTMLDivElement>(null);

  React.useLayoutEffect(() => {
    innerWidth > 0 &&
      setPills(prevState => [
        ...prevState,
        {
          id: index,
          element: defaultReviewerPill(reviewer, index),
          elementWidth: Math.ceil(innerWidth)
        }
      ]);
    return () => setPills([]);
  }, [reviewer, index, innerWidth, setPills]);

  React.useLayoutEffect(() => {
    setInnerWidth((reviewerRef.current as HTMLDivElement).getBoundingClientRect().width);
  }, [reviewerRef]);

  return (
    <div className='flex-row invisible' ref={reviewerRef}>
      {defaultReviewerPill(reviewer, index)}
    </div>
  );
};

const defaultReviewerPill = (reviewer: IdentityRefWithVote, i: number) => (
  <Tooltip
    key={i}
    renderContent={() => (
      <div className='flex-row rhythm-horizontal-4'>
        <div className='flex-column'>
          <div className='flex-row flex-center justify-center'>
            <VssPersona
              className='icon-margin'
              imageUrl={reviewer._links['avatar'].href}
              size={'small'}
              displayName={reviewer.displayName}
            />
            <span style={{ paddingBottom: 2 }}>{reviewer.displayName}</span>
          </div>
          <div className='flex-row flex-center justify-start margin-top-8'>
            {getReviewerVoteIconStatus(reviewer.vote)}
            <span className='font-weight-semibold margin-left-4'>{getReviewerVoteStatus(reviewer)}</span>
          </div>
        </div>
      </div>
    )}
  >
    <Pill key={reviewer.id} variant={2} color={reviewerVoteToIColorLight(reviewer.vote)} size={1}>
      <div className='flex-row rhythm-horizontal-8'>
        {getReviewerVoteIconStatus(reviewer.vote)}
        <span style={{ paddingBottom: 2 }}>{reviewer.displayName}</span>
      </div>
    </Pill>
  </Tooltip>
);

function getReviewerVoteStatus(reviewer: IdentityRefWithVote): string {
  const colorMap: Record<string, string> = {
    Approved: 'Approved',
    ApprovedWithSuggestions: 'Approved With Suggestions',
    NoVote: 'Assigned',
    WaitingForAuthor: 'Waiting For Author',
    Rejected: 'Rejected'
  };
  return colorMap[ReviewerVoteOption[reviewer.vote]];
}
