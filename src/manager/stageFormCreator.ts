import {InputStage, RoundRobinMode, SeedOrdering, StageSettings, StageType} from 'brackets-model';
import {i18n} from '../viewer/lang';

export type CallbackFunction = (config: InputStage) => void;

export type FormConfiguration = {
    parent_id: string,
    html_name_id: string,
    html_stage_type_selector_id: string
    html_team_input_id: string
    html_group_id: string
    html_seed_order_id: string
    html_round_robin_mode_id: string

    group_default_size: number
};

/**
 * Creates a DOM form to create different stages for the brackets-manager
 *
 * @param configuration HTML element IDs to render this form to
 * @param submitCallable Callback function - what should happen onClick on the forms submit button?
 */
export default function stageFormCreator(configuration: FormConfiguration, submitCallable: CallbackFunction): void {
    const parent = document.getElementById(configuration.parent_id);

    if (null === parent)
        throw new DOMException('parent with ID: ' + configuration.parent_id + ' was not found!');


    // Name
    createInput(
        parent,
        'text',
        configuration.html_name_id,
        i18n('form-creator', 'stage_name_label'),
        i18n('form-creator', 'stage_name_placeholder'),
    );

    // Teams
    createTextarea(
        parent,
        configuration.html_team_input_id,
        i18n('form-creator', 'team_label'),
        i18n('form-creator', 'team_placeholder'),
    );

    // Stage selector
    const stages = ['round_robin', 'single_elimination', 'double_elimination'];
    createSelect(parent, configuration.html_stage_type_selector_id, i18n('form-creator', 'stage_selector_label'), stages);

    const stageSelector = document.getElementById(configuration.html_stage_type_selector_id);

    if (null === stageSelector)
        throw new DOMException('somehow we could not create a select!');


    stageSelector.onchange = (): void => {
        removeMaskFields(parent);

        let stage: StageType;

        switch ((<HTMLInputElement>stageSelector).value) {
            case 'single_elimination':
                stage = 'single_elimination';
                break;
            case 'double_elimination':
                stage = 'double_elimination';
                break;
            case 'round_robin':
                stage = 'round_robin';
                break;
            default:
                throw new DOMException('stage ' + (<HTMLInputElement>stageSelector).value + ' seems to be not implemented yet.');
        }

        createMaskFields(configuration, stage, parent, submitCallable);
    };

    // We're creating a round_robin here by default cause its selected on first load.
    createMaskFields(configuration, 'round_robin', parent, submitCallable);
}

/**
 * removing all fields of the mask which are not the name and the stage selector
 *
 * @param parent The HTML parent to hold the elements
 */
function removeMaskFields(parent: HTMLElement): void {
    // Remove everything after the second element cause we want to keep the name and the stage selector
    for (let i = 3; i < parent.children.length + 1; i++)
        parent.children[i].remove();

}

/**
 * removing all fields of the mask which are not the name and the stage selector
 *
 * @param config HTML element IDs to render this form to
 * @param stage Which type of stage are we building?
 * @param parent The parent DOM
 * @param submitCallable the callable to call when the data got created
 */
function createMaskFields(config: FormConfiguration, stage: StageType, parent: HTMLElement, submitCallable: CallbackFunction): void {
    switch (stage) {
        case 'round_robin':
            // Teams amount
            createInput(
                parent,
                'number',
                config.html_group_id,
                i18n('form-creator', 'group_label'),
                i18n('form-creator', 'group_placeholder'),
                config.group_default_size.toString(),
            );

            // Seed ordering
            const roundRobinSeeds = ['groups.effort_balanced', 'groups.seed_optimized', 'groups.bracket_optimized'];
            createSelect(parent, config.html_seed_order_id, i18n('form-creator', 'seed_order_label'), roundRobinSeeds);

            // Round robin mode
            const roundRobinMode = ['simple', 'double'];
            createSelect(parent, config.html_round_robin_mode_id, i18n('form-creator', 'round_robin_mode_label'), roundRobinMode);

            break;
        case 'double_elimination':

            break;
        case 'single_elimination':

            break;
        default:
            throw new DOMException('stage ' + stage + ' seems to be not implemented yet.');
    }

    const submitBtnWrapper = document.createElement('div');
    const submitBtn = document.createElement('button');
    submitBtn.innerText = i18n('form-creator', 'submit');

    submitBtnWrapper.appendChild(submitBtn);

    submitBtn.onclick = (): void => {
        let responsingData: InputStage;

        switch (stage) {
            case 'round_robin':
                // TODO !Number.isInteger(Math.log2(participantCount)) in validator

                const settings: StageSettings = {
                    seedOrdering: [
                        (<SeedOrdering>(<HTMLInputElement>document.getElementById(config.html_seed_order_id)).value ?? 'groups.effort_balanced'),
                    ],
                    roundRobinMode: (<RoundRobinMode>(<HTMLSelectElement>document.getElementById(config.html_round_robin_mode_id)).value ?? 'simple'),
                    groupCount: parseInt((<HTMLInputElement>document.getElementById(config.html_group_id)).value ?? '0'),
                };

                responsingData = {
                    name: (<HTMLInputElement>document.getElementById(config.html_name_id)).value ?? '',
                    seeding: (<HTMLTextAreaElement>document.getElementById(config.html_team_input_id)).value.split(','),
                    settings: settings,
                    tournamentId: 0,
                    type: stage,
                };

                break;
            case 'double_elimination': // TODO
                throw new DOMException('not implemented yet');
            case 'single_elimination': // TODO
                throw new DOMException('not implemented yet');
            default:
                throw new DOMException('stage ' + stage + ' seems to be not implemented yet.');
        }

        submitCallable(responsingData);
    };

    parent.appendChild(submitBtnWrapper);
}

/**
 * @param parent the parent DOM element to render to
 * @param textareaId the id of the textarea
 * @param labelText the text for the label of the textarea
 * @param textareaPlaceholder the placeholder for the textarea
 * @param textareaDefaultValue the default value for the textarea - if NULL or UNDEFINED this is not set
 */
function createTextarea(parent: HTMLElement, textareaId: string, labelText: string, textareaPlaceholder: string, textareaDefaultValue?: string): void {
    const wrapper = document.createElement('div');

    const label = document.createElement('label');
    label.setAttribute('for', textareaId);
    label.innerText = labelText;

    const textarea = document.createElement('textarea');
    textarea.placeholder = textareaPlaceholder;
    textarea.id = textareaId;

    if (null !== textareaDefaultValue && undefined !== textareaDefaultValue) {
        textarea.value = textareaDefaultValue;
    }

    wrapper.appendChild(label);
    wrapper.appendChild(textarea);

    parent.appendChild(wrapper);
}

/**
 * @param parent parent to render the DOM to
 * @param inputType input type
 * @param inputId the id for the input
 * @param labelText the label text for the input
 * @param inputPlaceholder the placeholder for the input
 * @param inputDefaultValue the default value for the input - if NULL or UNDEFINED this is not set
 */
function createInput(parent: HTMLElement, inputType: string, inputId: string, labelText: string, inputPlaceholder: string, inputDefaultValue?: string): void {
    const wrapper = document.createElement('div');

    const label = document.createElement('label');
    label.setAttribute('for', inputId);
    label.innerText = labelText;

    const input = document.createElement('input');
    input.type = inputType;
    input.placeholder = inputPlaceholder;
    input.id = inputId;

    if (null !== inputDefaultValue && undefined !== inputDefaultValue) {
        input.value = inputDefaultValue;
    }

    wrapper.appendChild(label);
    wrapper.appendChild(input);

    parent.appendChild(wrapper);
}

/**
 * @param parent The wrapper to render the created DOM Elements to
 * @param selectId The ID of the generated select
 * @param labelText The text of the label for the generated select
 * @param options The options to display in select
 */
function createSelect(parent: HTMLElement, selectId: string, labelText: string, options: string[]): void {
    const wrapper = document.createElement('div');

    const label = document.createElement('label');
    label.setAttribute('for', selectId);
    label.innerText = labelText;

    const select = document.createElement('select');
    select.id = selectId;

    createOptions(select, options);

    wrapper.appendChild(label);
    wrapper.appendChild(select);

    parent.appendChild(wrapper);
}

/**
 * @param optionSwitch HTMLELement to add the options to
 * @param options string list of possible options
 */
function createOptions(optionSwitch: HTMLElement, options: string[]): void {
    for (const i in options) {
        const option = document.createElement('option');
        option.innerText = options[i];
        optionSwitch.appendChild(option);
    }
}

window.stageFormCreator = stageFormCreator;
