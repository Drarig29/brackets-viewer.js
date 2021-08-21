import {InputStage, StageType} from 'brackets-model';
import {i18n} from '../viewer/lang';

export type CallbackFunction = (config: InputStage) => void;

export type FormConfiguration = {
    parent_id: string,
    html_name_id: string,
    html_stage_type_selector_id: string
};

/**
 * Creates a DOM form to create different stages for the brackets-manager
 *
 * @param configuration HTML element IDs to render this form to
 * @param submitCallable Callback function - what should happen onClick on the forms submit button?
 */
export default function stageFormCreator(configuration: FormConfiguration, submitCallable: CallbackFunction): void {
    const parent = document.getElementById(configuration.parent_id);

    if (null === parent) {
        throw new DOMException('parent with ID: ' + configuration.parent_id + ' was not found!');
    }

    // Name
    const nameDiv = document.createElement('div');
    const nameLabel = document.createElement('label');
    nameLabel.setAttribute('for', configuration.html_name_id);
    nameLabel.innerText = i18n('form-creator', 'stage_name_label');
    const nameInput = document.createElement('input');
    nameInput.type = 'text';
    nameInput.placeholder = i18n('form-creator', 'stage_name_placeholder');

    nameDiv.append(nameLabel);
    nameDiv.append(nameInput);

    parent.append(nameDiv);

    // Stage selector
    const stageSelectorDiv = document.createElement('div');
    const stageSelectorLabel = document.createElement('label');
    stageSelectorLabel.setAttribute('for', configuration.html_stage_type_selector_id);
    stageSelectorLabel.innerText = i18n('form-creator', 'stage_selector_label');
    const stageSelector = document.createElement('select');

    stageSelector.id = configuration.html_stage_type_selector_id;
    stageSelectorDiv.appendChild(stageSelectorLabel);

    const stages = ['round_robin', 'single_elimination', 'double_elimination'];
    for (const stageType in stages) {
        const stageSelectorOption = document.createElement('option');
        stageSelectorOption.innerText = stages[stageType];
        stageSelector.appendChild(stageSelectorOption);
    }

    stageSelectorDiv.appendChild(stageSelector);
    parent.append(stageSelectorDiv);

    stageSelector.onchange = (): void => {
        removeMaskFields(parent);

        let stage: StageType;

        switch (stageSelector.value) {
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
                throw new DOMException('stage ' + stageSelector.value + ' seems to be not implemented yet.');
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
    for (let i = 2; i < parent.children.length; i++) {
        parent.children[i].remove();
    }
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

            break;
        case 'double_elimination':

            break;
        case 'single_elimination':

            break;
        default:
            throw new DOMException('stage ' + stage + ' seems to be not implemented yet.');
    }

    const submitBtn = document.createElement('button');
    submitBtn.innerText = i18n('form-creator', 'submit');

    submitBtn.onclick = (): void => {
        // TODO validate forms
        // TODO create data for manager
        // TODO call callableFunc
        console.log('Submit');
    };

    parent.appendChild(submitBtn);
}

window.stageFormCreator = stageFormCreator;
