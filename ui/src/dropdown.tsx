// Copyright 2020 H2O.ai, Inc.
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//     http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

import * as Fluent from '@fluentui/react'
import { B, box, Id, S, wave } from 'h2o-wave'
import React from 'react'
import { Choice } from './choice_group'
import { fuzzysearch } from './parts/utils'
import { displayMixin } from './theme'
import { bond } from './ui'

/**
 * Create a dropdown.
 *
 * A dropdown is a list in which the selected item is always visible, and the others are visible on demand by clicking
 * a drop-down button. They are used to simplify the design and make a choice within the UI. When closed, only the
 * selected item is visible. When users click the drop-down button, all the options become visible.
 *
 * To change the value, users open the list and click another value or use the arrow keys (up and down) to
 * select a new value.
 *
 * Note: Use either the 'value' parameter or the 'values' parameter. Setting the 'values' parameter renders a
 * multi-select dropdown.
 */
export interface Dropdown {
  /** An identifying name for this component. */
  name: Id
  /** Text to be displayed alongside the component. */
  label?: S
  /** A string that provides a brief hint to the user as to what kind of information is expected in the field. */
  placeholder?: S
  /** The name of the selected choice. */
  value?: S
  /** The names of the selected choices. If this parameter is set, multiple selections will be allowed. */
  values?: S[]
  /** The choices to be presented. */
  choices?: Choice[]
  /** True if this is a required field. */
  required?: B
  /** True if this field is disabled. */
  disabled?: B
  /** True if the form should be submitted when the dropdown value changes. */
  trigger?: B
  /** True if the component should be visible. Defaults to true. */
  visible?: B
  /** An optional tooltip message displayed when a user clicks the help icon to the right of the component. */
  tooltip?: S
}

const
  MAX_DIALOG_WIDTH = 1000,
  MIN_DIALOG_WIDTH = 500,
  BaseDropdown = bond(({ model, isMultivalued }: { model: Dropdown, isMultivalued: B }) => {
    const
      selection = isMultivalued ? new Set<S>(model.values) : null,
      selectedOptionsB = box(Array.from(selection || [])),
      options = (model.choices || []).map(({ name, label, disabled }): Fluent.IDropdownOption => ({ key: name, text: label || name, disabled })),
      onChange = (_e?: React.FormEvent<HTMLElement>, option?: Fluent.IDropdownOption) => {
        if (option) {
          const name = option.key as S
          if (isMultivalued && selection !== null) {
            option.selected ? selection.add(name) : selection.delete(name)

            const selectedOpts = Array.from(selection)
            wave.args[model.name] = selectedOpts
            selectedOptionsB(selectedOpts)
          } else {
            wave.args[model.name] = name
          }
        }
        if (model.trigger) wave.sync()
      },
      selectAll = () => {
        if (!selection) return

        selection.clear()
        options.forEach(o => { if (!o.disabled) selection.add(o.key as S) })

        const selectionArr = Array.from(selection)
        selectedOptionsB(selectionArr)
        wave.args[model.name] = selectionArr

        onChange()
      },
      deselectAll = () => {
        if (!selection) return

        selection.clear()
        selectedOptionsB([])
        wave.args[model.name] = []

        onChange()
      },
      render = () => (
        <>
          <Fluent.Dropdown
            data-test={model.name}
            label={model.label}
            placeholder={model.placeholder}
            options={options}
            required={model.required}
            disabled={model.disabled}
            multiSelect={isMultivalued || undefined}
            defaultSelectedKey={!isMultivalued ? model.value : undefined}
            selectedKeys={isMultivalued ? selectedOptionsB() : undefined}
            onChange={onChange}
          />
          {
            isMultivalued &&
            <Fluent.Text variant='small'>
              <Fluent.Link onClick={selectAll}>Select All</Fluent.Link> | <Fluent.Link onClick={deselectAll}>Deselect All</Fluent.Link>
            </Fluent.Text>
          }
        </>
      )

    return { render, selectedOptionsB }
  }),
  DialogDropdown = bond(({ model, isMultivalued }: { model: Dropdown, isMultivalued: B }) => {
    const
      isDialogHiddenB = box(true),
      items = model.choices?.map(({ name, label }) => ({ key: name, text: label || name })) || [],
      selection = new Fluent.Selection<Fluent.IObjectWithKey & { text?: S }>({ items }),
      initialSelectionB = box<S[]>([]),
      filteredItemsB = box(items),
      minWidth = Math.min(MAX_DIALOG_WIDTH, items.reduce((width, { text }) => Math.max(width, text.length * 9), MIN_DIALOG_WIDTH)),
      labelB = box(''),
      toggleDialog = () => {
        const isHidden = isDialogHiddenB()
        if (isHidden) {
          filteredItemsB(items)
        }
        isDialogHiddenB(!isHidden)
      },
      cancelDialog = () => {
        isDialogHiddenB(true)
        selection.setAllSelected(false)
        initialSelectionB().forEach(k => selection.setKeySelected(k, true, false))
      },
      submit = () => {
        const result = selection.getSelection().map(({ key }) => key as S)
        wave.args[model.name] = result.length === 1 ? result[0] : result

        if (model.trigger) wave.sync()
        labelB(selection.getSelectedCount() ? selection.getSelection().map(({ text }) => text).join(', ') : '')
        toggleDialog()
        initialSelectionB([...selection.getSelection().map(({ key }) => key as S)])
      },
      selectAll = () => selection.setAllSelected(true),
      deselectAll = () => selection.setAllSelected(false),
      onSearchChange = (_e?: React.ChangeEvent<HTMLInputElement>, newVal = '') => filteredItemsB(items.filter(({ text }) => fuzzysearch(text, newVal))),
      init = () => {
        if (!model.values?.length && !model.value) return

        const itemsMap = new Map<S, S>()
        items.forEach(({ key, text }) => itemsMap.set(key, text))

        if (model.values?.length) {
          model.values.forEach(v => selection.setKeySelected(v, true, false))
          labelB(model.values.map(v => itemsMap.get(v) || '').filter(Boolean).join(', ') || labelB())
          initialSelectionB().push(...model.values)
        }
        if (model.value) {
          selection.setKeySelected(model.value, true, false)
          labelB(itemsMap.get(model.value) || labelB())
          initialSelectionB().push(model.value)
        }
      },
      render = () => (
        <>
          <Fluent.TextField
            data-test={model.name}
            iconProps={{ iconName: 'ChevronDown' }}
            readOnly
            onClick={toggleDialog}
            label={model.label}
            disabled={model.disabled}
            required={model.required}
            styles={{ field: { cursor: 'pointer' }, icon: { fontSize: 12, color: Fluent.getTheme().palette.neutralSecondary } }}
            value={labelB()} />
          <Fluent.Dialog hidden={isDialogHiddenB()} dialogContentProps={{ title: model.label }} minWidth={minWidth}>
            <Fluent.DialogContent styles={{ innerContent: { height: 600 }, header: { height: 0 } }}>
              <Fluent.SearchBox data-test={`${model.name}-search`} onChange={onSearchChange} placeholder={model.placeholder} />
              <Fluent.Text variant='small' styles={{ root: { marginTop: 32, float: 'right' } }} block>
                <Fluent.Link onClick={selectAll}>Select All</Fluent.Link> | <Fluent.Link onClick={deselectAll}>Deselect All</Fluent.Link>
              </Fluent.Text>
              <Fluent.ScrollablePane styles={{ root: { top: 90 }, stickyAbove: { display: 'none' } }}>
                <Fluent.DetailsList
                  items={filteredItemsB()}
                  styles={{ headerWrapper: { display: 'none' }, root: { overflowY: 'auto' } }}
                  columns={[{ key: 'label', name: 'Option', minWidth: 200, fieldName: 'text' }]}
                  selection={selection}
                  selectionMode={isMultivalued ? Fluent.SelectionMode.multiple : Fluent.SelectionMode.single}
                  checkboxVisibility={Fluent.CheckboxVisibility.always}
                />
              </Fluent.ScrollablePane>
            </Fluent.DialogContent>
            <Fluent.DialogFooter>
              <Fluent.DefaultButton text='Cancel' onClick={cancelDialog} />
              <Fluent.PrimaryButton text='Select' onClick={submit} />
            </Fluent.DialogFooter>
          </Fluent.Dialog>
        </>
      )
    return { init, render, isDialogHiddenB, filteredItemsB, labelB, initialSelectionB }
  })

export const
  XDropdown = bond(({ model: m }: { model: Dropdown }) => {
    const isMultivalued = !!m.values
    // TODO: Consider setting args only if value / values are included in choices. 
    wave.args[m.name] = isMultivalued
      ? (m.values || [])
      : (m.value || null)

    const
      render = () => (
        <div style={displayMixin(m.visible)}>
          {
            (m.choices || []).length > 100
              ? <DialogDropdown model={m} isMultivalued={isMultivalued} />
              : <BaseDropdown model={m} isMultivalued={isMultivalued} />
          }
        </div>
      )

    return { render }
  })