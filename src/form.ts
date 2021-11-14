import { GrandFinalType, InputStage, RoundRobinMode, SeedOrdering, StageSettings, StageType } from 'brackets-model';
import { t } from './lang';

const stageTypes: StageType[] = ['round_robin', 'single_elimination', 'double_elimination'];

const roundRobinMode: RoundRobinMode[] = ['simple', 'double'];
const roundRobinSeeds: SeedOrdering[] = ['groups.effort_balanced', 'groups.seed_optimized', 'groups.bracket_optimized'];

const eliminationOrderings: SeedOrdering[] = ['natural', 'reverse', 'half_shift', 'reverse_half_shift', 'pair_flip', 'inner_outer'];

const grandFinalTypes: GrandFinalType[] = ['none', 'simple', 'double'];

export type CallbackFunction = (config: InputStage) => void;

export type FormConfiguration = {
    parent_id: string,
    html_name_id: string,
    html_stage_type_selector_id: string
    html_team_input_id: string
    html_group_id: string
    html_seed_order_id: string
    html_round_robin_mode_id: string
    html_consolation_final_checkbox_id: string
    html_skip_first_round_checkbox_id: string
    html_grand_final_type_id: string
    html_double_elimination_seed_textarea_id: string

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

    createBaseMask(parent, configuration);

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
 * Removes all fields of the mask which are not the name and the stage selector.
 *
 * @param parent The HTML parent to hold the elements.
 */
function removeMaskFields(parent: HTMLElement): void {
    if (parent.children.length <= 3) return;

    // Keep the first 3 "base" items.
    for (let i = 3; i < parent.children.length; i++) {
        parent.children[i].remove();
        i--;
    }
}


/**
 * @param parent HTMLElement
 * @param configuration FormConfiguration
 */
function createBaseMask(parent: HTMLElement, configuration: FormConfiguration): void {
    // Name
    createInput(
        parent,
        'text',
        configuration.html_name_id,
        t('form-creator.stage-name-label'),
        t('form-creator.stage-name-placeholder'),
        undefined,
        undefined,
        1,
    );

    // Teams
    createTextarea(
        parent,
        configuration.html_team_input_id,
        t('form-creator.team-label'),
        t('form-creator.team-placeholder'),
    );

    // Stage selector
    createSelect(parent, configuration.html_stage_type_selector_id, t('form-creator.stage-selector-label'), stageTypes);
}

/**
 * removing all fields of the mask which are not the name and the stage selector
 *
 * @param config HTML element IDs to render this form to
 * @param stage Which type of stage are we building?
 * @param parent The parent DOM
 * @param submitCallback the callable to call when the data got created
 */
function createMaskFields(config: FormConfiguration, stage: StageType, parent: HTMLElement, submitCallback: CallbackFunction): void {
    switch (stage) {
        case 'round_robin':
            // Teams amount
            createInput(
                parent,
                'number',
                config.html_group_id,
                t('form-creator.group-label'),
                t('form-creator.group-placeholder'),
                config.group_default_size.toString(),
                '1',
            );

            // Seed ordering
            createSelect(parent, config.html_seed_order_id, t('form-creator.seed-order-label'), roundRobinSeeds);

            // Round robin mode
            createSelect(parent, config.html_round_robin_mode_id, t('form-creator.round-robin-mode-label'), roundRobinMode);

            break;
        case 'double_elimination':
            // Consolation Final
            createInput(parent, 'checkbox', config.html_consolation_final_checkbox_id, t('form-creator.consolation-final-label'));

            // Skip first round
            createInput(parent, 'checkbox', config.html_skip_first_round_checkbox_id, t('form-creator.skip-first-round-label'));

            // Grand final types
            createSelect(parent, config.html_grand_final_type_id, t('form-creator.grand-final-type-label'), grandFinalTypes);

            // Seed orders
            createTextarea(
                parent,
                config.html_double_elimination_seed_textarea_id,
                t('form-creator.seed-order-label'),
                t('form-creator.double-elimination-seed-order-placeholder'),
            );

            break;
        case 'single_elimination':
            // Seed ordering
            createSelect(parent, config.html_seed_order_id, t('form-creator.seed-order-label'), eliminationOrderings);

            // Consolation Final
            createInput(parent, 'checkbox', config.html_consolation_final_checkbox_id, t('form-creator.consolation-final-label'));

            break;
        default:
            throw new DOMException('stage ' + stage + ' seems to be not implemented yet.');
    }

    const submitBtnWrapper = document.createElement('div');
    const submitBtn = document.createElement('button');
    submitBtn.innerText = t('form-creator.submit');
    submitBtn.type = 'submit';

    submitBtnWrapper.appendChild(submitBtn);

    submitBtn.onclick = (): void => {
        let query: InputStage;

        switch (stage) {
            case 'round_robin':
                try {
                    validateRoundRobin(config);
                } catch (e) {
                    alert((<DOMException>e).message);
                    return;
                }

                const roundRobinSettings: StageSettings = {
                    seedOrdering: [
                        (<SeedOrdering>(<HTMLInputElement>document.getElementById(config.html_seed_order_id)).value ?? 'groups.effort_balanced'),
                    ],
                    roundRobinMode: (<RoundRobinMode>(<HTMLSelectElement>document.getElementById(config.html_round_robin_mode_id)).value ?? 'simple'),
                    groupCount: parseInt((<HTMLInputElement>document.getElementById(config.html_group_id)).value ?? '0'),
                };

                query = {
                    name: (<HTMLInputElement>document.getElementById(config.html_name_id)).value ?? '',
                    seeding: (<HTMLTextAreaElement>document.getElementById(config.html_team_input_id)).value.split(','),
                    settings: roundRobinSettings,
                    tournamentId: 0,
                    type: stage,
                };

                break;
            case 'double_elimination':
                validateDoubleElimination(config);

                const rawSeedOrder = (<HTMLTextAreaElement>document.getElementById(config.html_double_elimination_seed_textarea_id)).value.split(',');
                const seedOrder: SeedOrdering[] = [];

                for (const i in rawSeedOrder)
                    seedOrder.push(<SeedOrdering>rawSeedOrder[i].trim());

                const doubleEliminationSettings: StageSettings = {
                    seedOrdering: seedOrder,
                    consolationFinal: (<HTMLInputElement>document.getElementById(config.html_consolation_final_checkbox_id)).checked,
                    skipFirstRound: (<HTMLInputElement>document.getElementById(config.html_skip_first_round_checkbox_id)).checked,
                    grandFinal: <GrandFinalType>(<HTMLSelectElement>document.getElementById(config.html_grand_final_type_id)).value,
                };

                query = {
                    name: (<HTMLInputElement>document.getElementById(config.html_name_id)).value ?? '',
                    seeding: (<HTMLTextAreaElement>document.getElementById(config.html_team_input_id)).value.split(','),
                    settings: doubleEliminationSettings,
                    tournamentId: 0,
                    type: stage,
                };

                break;
            case 'single_elimination':
                validateSingleElimination(config);

                const singleEliminationSettings: StageSettings = {
                    seedOrdering: [
                        (<SeedOrdering>(<HTMLInputElement>document.getElementById(config.html_seed_order_id)).value ?? 'natural'),
                    ],
                    consolationFinal: (<HTMLInputElement>document.getElementById(config.html_consolation_final_checkbox_id)).checked,
                };

                query = {
                    name: (<HTMLInputElement>document.getElementById(config.html_name_id)).value ?? '',
                    seeding: (<HTMLTextAreaElement>document.getElementById(config.html_team_input_id)).value.split(','),
                    settings: singleEliminationSettings,
                    tournamentId: 0,
                    type: stage,
                };

                break;
            default:
                throw new DOMException('stage ' + stage + ' seems to be not implemented yet.');
        }

        submitCallback(query);
    };

    parent.appendChild(submitBtnWrapper);
}

/**
 * validates everything for the double_elimination stage
 *
 * @param config FormConfig
 */
function validateDoubleElimination(config: FormConfiguration): void {
    baseValidation(config);

    const grandFinalType = (<HTMLSelectElement>document.getElementById(config.html_grand_final_type_id)).value as GrandFinalType;
    if (!grandFinalType || !grandFinalTypes.includes(grandFinalType))
        throw new DOMException('grand_final_type must be one of: ' + grandFinalTypes.toString());

    const orderings = (<HTMLTextAreaElement>document.getElementById(config.html_double_elimination_seed_textarea_id)).value.split(',');
    for (const i in orderings) {
        if (orderings[i] === '') {
            delete orderings[i];
            continue;
        }

        const ordering = orderings[i].trim() as SeedOrdering;

        if (!eliminationOrderings.includes(ordering))
            throw new DOMException('elimination seed_ordering wrong found: ' + ordering + 'must be one of: ' + eliminationOrderings.toString());
    }
}

/**
 * validates everything for a single_elimination stage
 *
 * @param config FormConfiguration
 */
function validateSingleElimination(config: FormConfiguration): void {
    baseValidation(config);

    const ordering = (<HTMLSelectElement>document.getElementById(config.html_seed_order_id)).value as SeedOrdering;
    if (!ordering || !eliminationOrderings.includes(ordering))
        throw new DOMException('seed_ordering must be one of: ' + eliminationOrderings.toString());
}

/**
 * validates everything for a round_robin stage
 *
 * @param config FormConfiguration
 */
function validateRoundRobin(config: FormConfiguration): void {
    baseValidation(config);

    const groupAmount = parseInt((<HTMLInputElement>document.getElementById(config.html_group_id)).value);
    if (groupAmount <= 0)
        throw new DOMException('group_amount must be equal or bigger than 1');

    const ordering = (<HTMLSelectElement>document.getElementById(config.html_seed_order_id)).value as SeedOrdering;
    if (!roundRobinSeeds.includes(ordering))
        throw new DOMException('seed_ordering must be one of ' + roundRobinSeeds.toString());

    const roundRobinMode = (<HTMLSelectElement>document.getElementById(config.html_round_robin_mode_id)).value;
    if (!roundRobinMode.includes(roundRobinMode))
        throw new DOMException('round_robin_mode must be one of ' + roundRobinMode.toString());
}

/**
 * validates the field every specification has (name, teams and stage)
 *
 * @param config FormConfiguration
 */
function baseValidation(config: FormConfiguration): void {
    const name = (<HTMLInputElement>document.getElementById(config.html_name_id)).value;
    if (!name || name === '')
        throw new DOMException('No name provided.');

    const teams = (<HTMLInputElement>document.getElementById(config.html_team_input_id)).value.split(',');
    if (teams.length < 2 || !Number.isInteger(Math.log2(teams.length)))
        throw new DOMException('Invalid team amount provided.');

    const stageType = (<HTMLInputElement>document.getElementById(config.html_stage_type_selector_id)).value as StageType;
    if (!stageType && stageTypes.includes(stageType))
        throw new DOMException('Invalid stage.');
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

    if (null !== textareaDefaultValue && undefined !== textareaDefaultValue)
        textarea.value = textareaDefaultValue;

    wrapper.appendChild(label);
    wrapper.appendChild(textarea);

    parent.appendChild(wrapper);
}

/**
 * @param parent parent to render the DOM to
 * @param inputType input type
 * @param inputId the id for the input
 * @param labelText the label text for the input
 * @param inputPlaceholder the placeholder for the input - if NULL or UNDEFINED this is not set
 * @param inputDefaultValue the default value for the input - if NULL or UNDEFINED this is not set
 * @param inputMinValue the min value for the input - if NULL or UNDEFINED this is not set
 * @param inputMinLengthValue the minLength value for the input - if NULL or UNDEFINED this is not set
 */
function createInput(parent: HTMLElement, inputType: string, inputId: string, labelText: string, inputPlaceholder?: string, inputDefaultValue?: string, inputMinValue?: string, inputMinLengthValue?: number): void {
    const wrapper = document.createElement('div');

    const label = document.createElement('label');
    label.setAttribute('for', inputId);
    label.innerText = labelText;

    const input = document.createElement('input');
    input.type = inputType;
    input.id = inputId;

    if (null !== inputPlaceholder && undefined !== inputPlaceholder)
        input.placeholder = inputPlaceholder;

    if (null !== inputDefaultValue && undefined !== inputDefaultValue)
        input.value = inputDefaultValue;

    if (null !== inputMinValue && undefined !== inputMinValue)
        input.min = inputMinValue;

    if (null !== inputMinLengthValue && undefined !== inputMinLengthValue)
        input.minLength = inputMinLengthValue;

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
