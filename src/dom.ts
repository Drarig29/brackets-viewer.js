import { ParticipantResult } from 'brackets-model';
import { rankingHeader } from './helpers';
import { abbreviations } from './lang';
import { Connection, FinalType, Placement, Ranking } from './types';

/**
 * Creates the title of the viewer.
 *
 * @param title The title to set.
 */
export function createTitle(title: string): HTMLElement {
    const h1 = document.createElement('h1');
    h1.innerText = title;
    return h1;
}

/**
 * Creates a container which contains a round-robin stage.
 */
export function createRoundRobinContainer(): HTMLElement {
    const container = document.createElement('div');
    container.classList.add('round-robin');
    return container;
}

/**
 * Creates a container which contains a single bracket of a single or double elimination.
 */
export function createBracketContainer(): HTMLElement {
    const bracket = document.createElement('section');
    bracket.classList.add('bracket');
    return bracket;
}

/**
 * Creates a container which contains a group.
 *
 * @param title Title of the group.
 */
export function createGroupContainer(title: string): HTMLElement {
    const h2 = document.createElement('h2');
    h2.innerText = title;

    const groupDOM = document.createElement('section');
    groupDOM.classList.add('group');
    groupDOM.append(h2);
    return groupDOM;
}

/**
 * Creates a container which contains a round.
 *
 * @param title Title of the round.
 */
export function createRoundContainer(title: string): HTMLElement {
    const h3 = document.createElement('h3');
    h3.innerText = title;

    const roundDOM = document.createElement('article');
    roundDOM.classList.add('round');
    roundDOM.append(h3);
    return roundDOM;
}

/**
 * Creates a container which contains a match.
 */
export function createMatchContainer(): HTMLElement {
    const match = document.createElement('div');
    match.classList.add('match');
    return match;
}

/**
 * Creates a container which contains the label of a match.
 *
 * @param label The label of the match.
 * @param status The status to set as tooltip.
 */
export function createMatchLabel(label: string, status: string): HTMLElement {
    const span = document.createElement('span');
    span.innerText = label;
    span.title = status;
    return span;
}

/**
 * Creates a container which contains the opponents of a match.
 */
export function createOpponentsContainer(): HTMLElement {
    const opponents = document.createElement('div');
    opponents.classList.add('opponents');
    return opponents;
}

/**
 * Creates a container which contains a participant.
 */
export function createParticipantContainer(): HTMLElement {
    const teamDOM = document.createElement('div');
    teamDOM.classList.add('participant');
    return teamDOM;
}

/**
 * Creates a container which contains the name of a participant.
 */
export function createNameContainer(): HTMLElement {
    const nameDOM = document.createElement('div');
    nameDOM.classList.add('name');
    return nameDOM;
}

/**
 * Creates a container which contains the result of a match for a participant.
 */
export function createResultContainer(): HTMLElement {
    const resultDOM = document.createElement('div');
    resultDOM.classList.add('result');
    return resultDOM;
}

/**
 * Creates a table.
 */
export function createTable(): HTMLElement {
    return document.createElement('table');
}

/**
 * Creates a table row.
 */
export function createRow(): HTMLElement {
    return document.createElement('tr');
}

/**
 * Creates a table cell.
 *
 * @param data The data in the cell.
 */
export function createCell(data: string | number): HTMLElement {
    const td = document.createElement('td');
    td.innerText = String(data);
    return td;
}

/**
 * Creates the headers for a ranking table.
 *
 * @param ranking The object containing the ranking.
 */
export function createRankingHeaders(ranking: Ranking): HTMLElement {
    const headers = document.createElement('tr');
    const firstItem = ranking[0];

    for (const prop in firstItem) {
        const header = rankingHeader(prop);
        const th = document.createElement('th');
        th.innerText = header.text;
        th.setAttribute('title', header.tooltip);
        headers.append(th);
    }

    return headers;
}

/**
 * Sets a hint on a name container.
 *
 * @param nameContainer The name container.
 * @param hint The hint to set.
 */
export function setupHint(nameContainer: HTMLElement, hint: string): void {
    nameContainer.classList.add('hint');
    nameContainer.innerText = hint;
}

/**
 * Sets a win for a participant.
 *
 * @param participantContainer The participant container.
 * @param resultContainer The result container.
 * @param participant The participant result.
 */
export function setupWin(participantContainer: HTMLElement, resultContainer: HTMLElement, participant: ParticipantResult): void {
    if (participant.result && participant.result === 'win') {
        participantContainer.classList.add('win');

        if (participant.score === undefined)
            resultContainer.innerText = abbreviations.win;
    }
}

/**
 * Sets a loss for a participant.
 *
 * @param participantContainer The participant container.
 * @param resultContainer The result container.
 * @param participant The participant result.
 */
export function setupLoss(participantContainer: HTMLElement, resultContainer: HTMLElement, participant: ParticipantResult): void {
    if (participant.result && participant.result === 'loss' || participant.forfeit) {
        participantContainer.classList.add('loss');

        if (participant.forfeit)
            resultContainer.innerText = abbreviations.forfeit;
        else if (participant.score === undefined)
            resultContainer.innerText = abbreviations.loss;
    }
}

/**
 * Adds the participant origin to a name 
 *
 * @param nameContainer The name container.
 * @param text The text to set (origin).
 * @param placement The placement of the participant origin.
 */
export function addTeamOrigin(nameContainer: HTMLElement, text: string, placement: Placement): void {
    const span = document.createElement('span');

    if (placement === 'before') {
        span.innerText = `${text} `;
        nameContainer.prepend(span);
    } else if (placement === 'after') {
        span.innerText = ` (${text})`;
        nameContainer.append(span);
    }
}

/**
 * Returns the connection for a given round in a bracket.
 *
 * @param roundNumber Number of the round.
 * @param roundCount Count of rounds.
 * @param inLowerBracket Whether the round is in lower bracket.
 * @param connectFinal Whether to connect to the final.
 */
export function getBracketConnection(roundNumber: number, roundCount: number, inLowerBracket?: boolean, connectFinal?: boolean): Connection {
    if (inLowerBracket) {
        return {
            connectPrevious: roundNumber > 1 && (roundNumber % 2 === 1 ? 'square' : 'straight'),
            connectNext: roundNumber < roundCount && (roundNumber % 2 === 0 ? 'square' : 'straight'),
        };
    }

    return {
        connectPrevious: roundNumber > 1 && 'square',
        connectNext: roundNumber < roundCount ? 'square' : (connectFinal ? 'straight' : false),
    }
}

/**
 * Returns the connection for a given round in the final.
 *
 * @param finalType Type of final.
 * @param roundNumber Number of the round.
 * @param matchCount The count of matches.
 */
export function getFinalConnection(finalType: FinalType, roundNumber: number, matchCount: number): Connection {
    return {
        connectPrevious: finalType === 'grand_final' && (roundNumber === 1 && 'straight'),
        connectNext: matchCount === 2 && roundNumber === 1 && 'straight',
    };
}

/**
 * Sets the connection a match containers.
 *
 * @param teamsContainer The opponents container.
 * @param matchContainer The match container.
 * @param connection The connection to set.
 */
export function setupConnection(teamsContainer: HTMLElement, matchContainer: HTMLElement, connection: Connection): void {
    if (connection.connectPrevious)
        teamsContainer.classList.add('connect-previous');

    if (connection.connectNext)
        matchContainer.classList.add('connect-next');

    if (connection.connectPrevious === 'straight')
        teamsContainer.classList.add('straight');

    if (connection.connectNext === 'straight')
        matchContainer.classList.add('straight');
}