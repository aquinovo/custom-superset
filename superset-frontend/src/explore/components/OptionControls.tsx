/**
 * Licensed to the Apache Software Foundation (ASF) under one
 * or more contributor license agreements.  See the NOTICE file
 * distributed with this work for additional information
 * regarding copyright ownership.  The ASF licenses this file
 * to you under the Apache License, Version 2.0 (the
 * "License"); you may not use this file except in compliance
 * with the License.  You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing,
 * software distributed under the License is distributed on an
 * "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
 * KIND, either express or implied.  See the License for the
 * specific language governing permissions and limitations
 * under the License.
 */
import React, { useRef } from 'react';
import { useDrag, useDrop, DropTargetMonitor } from 'react-dnd';
import { styled, t, useTheme } from '@superset-ui/core';
import {
  MetricOption,
  InfoTooltipWithTrigger,
} from '@superset-ui/chart-controls';
import { Tooltip } from 'src/common/components/Tooltip';
import Icon from 'src/components/Icon';
import { savedMetricType } from 'src/explore/components/controls/MetricControl/types';
import AdhocMetric from './controls/MetricControl/AdhocMetric';

export const DragContainer = styled.div`
  margin-bottom: ${({ theme }) => theme.gridUnit}px;
  :last-child {
    margin-bottom: 0;
  }
`;

export const OptionControlContainer = styled.div<{
  withCaret?: boolean;
}>`
  display: flex;
  align-items: center;
  width: 100%;
  font-size: ${({ theme }) => theme.typography.sizes.s}px;
  height: ${({ theme }) => theme.gridUnit * 6}px;
  background-color: ${({ theme }) => theme.colors.grayscale.light3};
  border-radius: 3px;
  cursor: ${({ withCaret }) => (withCaret ? 'pointer' : 'default')};
`;

export const Label = styled.div`
  display: flex;
  max-width: 100%;
  overflow: hidden;
  text-overflow: ellipsis;
  align-items: center;
  white-space: nowrap;
  padding-left: ${({ theme }) => theme.gridUnit}px;
  svg {
    margin-right: ${({ theme }) => theme.gridUnit}px;
  }
  .option-label {
    display: inline;
  }
`;

export const CaretContainer = styled.div`
  height: 100%;
  border-left: solid 1px ${({ theme }) => theme.colors.grayscale.dark2}0C;
  margin-left: auto;
`;

export const CloseContainer = styled.div`
  height: 100%;
  width: ${({ theme }) => theme.gridUnit * 6}px;
  border-right: solid 1px ${({ theme }) => theme.colors.grayscale.dark2}0C;
  cursor: pointer;
`;

const StyledInfoTooltipWithTrigger = styled(InfoTooltipWithTrigger)`
  margin: 0 ${({ theme }) => theme.gridUnit}px;
`;

export const HeaderContainer = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
`;

export const LabelsContainer = styled.div`
  padding: ${({ theme }) => theme.gridUnit}px;
  border: solid 1px ${({ theme }) => theme.colors.grayscale.light2};
  border-radius: ${({ theme }) => theme.gridUnit}px;
`;

export const DndLabelsContainer = styled.div<{
  canDrop?: boolean;
  isOver?: boolean;
}>`
  padding: ${({ theme }) => theme.gridUnit}px;
  border: ${({ canDrop, isOver, theme }) => {
    if (canDrop) {
      return `dashed 1px ${theme.colors.info.dark1}`;
    }
    if (isOver && !canDrop) {
      return `dashed 1px ${theme.colors.error.dark1}`;
    }
    return `solid 1px ${theme.colors.grayscale.light2}`;
  }};
  border-radius: ${({ theme }) => theme.gridUnit}px;
`;

export const AddControlLabel = styled.div<{
  cancelHover?: boolean;
}>`
  display: flex;
  align-items: center;
  width: 100%;
  height: ${({ theme }) => theme.gridUnit * 6}px;
  padding-left: ${({ theme }) => theme.gridUnit}px;
  font-size: ${({ theme }) => theme.typography.sizes.s}px;
  color: ${({ theme }) => theme.colors.grayscale.light1};
  border: dashed 1px ${({ theme }) => theme.colors.grayscale.light2};
  border-radius: ${({ theme }) => theme.gridUnit}px;
  cursor: ${({ cancelHover }) => (cancelHover ? 'inherit' : 'pointer')};

  :hover {
    background-color: ${({ cancelHover, theme }) =>
      cancelHover ? 'inherit' : theme.colors.grayscale.light4};
  }

  :active {
    background-color: ${({ cancelHover, theme }) =>
      cancelHover ? 'inherit' : theme.colors.grayscale.light3};
  }
`;

export const AddIconButton = styled.button`
  display: flex;
  align-items: center;
  justify-content: center;
  height: ${({ theme }) => theme.gridUnit * 4}px;
  width: ${({ theme }) => theme.gridUnit * 4}px;
  padding: 0;
  background-color: ${({ theme }) => theme.colors.primary.dark1};
  border: none;
  border-radius: 2px;

  :disabled {
    cursor: not-allowed;
    background-color: ${({ theme }) => theme.colors.grayscale.light1};
  }
`;

interface DragItem {
  index: number;
  type: string;
}

export const OptionControlLabel = ({
  label,
  savedMetric,
  adhocMetric,
  onRemove,
  onMoveLabel,
  onDropLabel,
  withCaret,
  isFunction,
  type,
  index,
  isExtra,
  ...props
}: {
  label: string | React.ReactNode;
  savedMetric?: savedMetricType;
  adhocMetric?: AdhocMetric;
  onRemove: () => void;
  onMoveLabel: (dragIndex: number, hoverIndex: number) => void;
  onDropLabel: () => void;
  withCaret?: boolean;
  isFunction?: boolean;
  isDraggable?: boolean;
  type: string;
  index: number;
  isExtra?: boolean;
}) => {
  const theme = useTheme();
  const ref = useRef<HTMLDivElement>(null);
  const [, drop] = useDrop({
    accept: type,
    drop() {
      onDropLabel?.();
    },
    hover(item: DragItem, monitor: DropTargetMonitor) {
      if (!ref.current) {
        return;
      }
      const dragIndex = item.index;
      const hoverIndex = index;
      // Don't replace items with themselves
      if (dragIndex === hoverIndex) {
        return;
      }
      // Determine rectangle on screen
      const hoverBoundingRect = ref.current?.getBoundingClientRect();
      // Get vertical middle
      const hoverMiddleY =
        (hoverBoundingRect.bottom - hoverBoundingRect.top) / 2;
      // Determine mouse position
      const clientOffset = monitor.getClientOffset();
      // Get pixels to the top
      const hoverClientY = clientOffset?.y
        ? clientOffset?.y - hoverBoundingRect.top
        : 0;
      // Only perform the move when the mouse has crossed half of the items height
      // When dragging downwards, only move when the cursor is below 50%
      // When dragging upwards, only move when the cursor is above 50%
      // Dragging downwards
      if (dragIndex < hoverIndex && hoverClientY < hoverMiddleY) {
        return;
      }
      // Dragging upwards
      if (dragIndex > hoverIndex && hoverClientY > hoverMiddleY) {
        return;
      }
      // Time to actually perform the action
      onMoveLabel?.(dragIndex, hoverIndex);
      // Note: we're mutating the monitor item here!
      // Generally it's better to avoid mutations,
      // but it's good here for the sake of performance
      // to avoid expensive index searches.
      // eslint-disable-next-line no-param-reassign
      item.index = hoverIndex;
    },
  });
  const [, drag] = useDrag({
    item: {
      type,
      index,
      value: savedMetric?.metric_name ? savedMetric : adhocMetric,
    },
    collect: monitor => ({
      isDragging: monitor.isDragging(),
    }),
  });

  const getLabelContent = () => {
    if (savedMetric?.metric_name) {
      return <MetricOption metric={savedMetric} />;
    }
    return <Tooltip title={label}>{label}</Tooltip>;
  };

  const getOptionControlContent = () => (
    <OptionControlContainer
      withCaret={withCaret}
      data-test="option-label"
      {...props}
    >
      <CloseContainer
        role="button"
        data-test="remove-control-button"
        onClick={onRemove}
      >
        <Icon name="x-small" color={theme.colors.grayscale.light1} />
      </CloseContainer>
      <Label data-test="control-label">
        {isFunction && <Icon name="function" viewBox="0 0 16 11" />}
        {getLabelContent()}
      </Label>
      {isExtra && (
        <StyledInfoTooltipWithTrigger
          icon="exclamation-triangle"
          placement="top"
          bsStyle="warning"
          tooltip={t(`
                This filter was inherited from the dashboard's context.
                It won't be saved when saving the chart.
              `)}
        />
      )}
      {withCaret && (
        <CaretContainer>
          <Icon name="caret-right" color={theme.colors.grayscale.light1} />
        </CaretContainer>
      )}
    </OptionControlContainer>
  );

  drag(drop(ref));
  return <DragContainer ref={ref}>{getOptionControlContent()}</DragContainer>;
};
