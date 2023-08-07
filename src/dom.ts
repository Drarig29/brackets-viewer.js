import { Match, ParticipantResult, FinalType, GroupType, Id, MatchGame } from 'brackets-model';
import { Connection, Placement, Ranking, RankingItem } from './types';
import { isMatchGame, rankingHeader } from './helpers';
import { t } from './lang';

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
 * Creates the title of a popover.
 *
 * @param title The title to set.
 */
export function createPopoverTitle(title: string): HTMLElement {
    const h4 = document.createElement('h4');
    h4.innerText = title;
    return h4;
}

/**
 * Creates a container which contains a round-robin stage.
 * 
 * @param stageId ID of the stage.
 */
export function createRoundRobinContainer(stageId: Id): HTMLElement {
    const stage = document.createElement('div');
    stage.classList.add('round-robin');
    stage.setAttribute('data-stage-id', stageId.toString());
    return stage;
}

/**
 * Creates a container which contains an elimination stage.
 * 
 * @param stageId ID of the stage.
 */
export function createEliminationContainer(stageId: Id): HTMLElement {
    const stage = document.createElement('div');
    stage.classList.add('elimination');
    stage.setAttribute('data-stage-id', stageId.toString());
    return stage;
}

/**
 * Creates a container which contains one bracket of a single or double elimination stage.
 *
 * @param groupId ID of the group.
 * @param title Title of the group.
 */
export function createBracketContainer(groupId?: Id, title?: string): HTMLElement {
    const bracket = document.createElement('section');
    bracket.classList.add('bracket');

    // Consolation matches are not in a group.
    if (groupId)
        bracket.setAttribute('data-group-id', groupId.toString());

    if (title) {
        const h2 = document.createElement('h2');
        h2.innerText = title;
        bracket.append(h2);
    }

    return bracket;
}

/**
 * Creates a container which contains a group for round-robin stages.
 *
 * @param groupId ID of the group.
 * @param title Title of the group.
 */
export function createGroupContainer(groupId: Id, title: string): HTMLElement {
    const h2 = document.createElement('h2');
    h2.innerText = title;

    const group = document.createElement('section');
    group.classList.add('group');
    group.setAttribute('data-group-id', groupId.toString());
    group.append(h2);
    return group;
}

/**
 * Creates a container which contains a list of rounds.
 */
export function createRoundsContainer(): HTMLElement {
    const round = document.createElement('div');
    round.classList.add('rounds');
    return round;
}

/**
 * Creates a container which contains a round.
 *
 * @param roundId ID of the round.
 * @param title Title of the round.
 */
export function createRoundContainer(roundId: Id, title: string): HTMLElement {
    const h3 = document.createElement('h3');
    h3.innerText = title;

    const round = document.createElement('article');
    round.classList.add('round');
    round.setAttribute('data-round-id', roundId.toString());
    round.append(h3);
    return round;
}

/**
 * Creates a container which contains a match.
 *
 * @param match A match or a match game.
 */
export function createMatchContainer(match?: Match | MatchGame): HTMLElement {
    const div = document.createElement('div');
    div.classList.add('match');

    if (match) {
        if (isMatchGame(match))
            div.setAttribute('data-match-game-id', match.id.toString());
        else
            div.setAttribute('data-match-id', match.id.toString());

        div.setAttribute('data-match-status', match.status.toString());
    }

    return div;
}

/**
 * Creates a container which contains the label of a match.
 *
 * @param label The label of the match.
 * @param status The status to set as tooltip.
 * @param onClick Called when the label is clicked.
 */
export function createMatchLabel(label: string | undefined, status: string, onClick?: (event: MouseEvent) => void): HTMLElement {
    const span = document.createElement('span');
    span.innerText = label || '';
    span.title = status;
    onClick && span.addEventListener('click', onClick);
    return span;
}

/**
 * Creates a container which contains the child count label of a match.
 *
 * @param label The child count label of the match.
 * @param onClick Called when the label is clicked.
 */
export function createChildCountLabel(label: string, onClick?: (event: MouseEvent) => void): HTMLElement {
    const span = document.createElement('span');
    span.innerText = label;
    onClick && span.addEventListener('click', onClick);
    return span;
}

/**
 * Creates a container which contains the opponents of a match.
 *
 * @param onClick Called when the match is clicked.
 */
export function createOpponentsContainer(onClick?: () => void): HTMLElement {
    const opponents = document.createElement('div');
    opponents.classList.add('opponents');
    onClick && opponents.addEventListener('click', onClick);
    return opponents;
}

/**
 * Creates a container which contains a participant.
 *
 * @param participantId ID of the participant.
 */
export function createParticipantContainer(participantId: Id | null): HTMLElement {
    const participant = document.createElement('div');
    participant.classList.add('participant');

    if (participantId !== null && participantId !== undefined)
        participant.setAttribute('data-participant-id', participantId.toString());

    return participant;
}

/**
 * Creates a container which contains the name of a participant.
 */
export function createNameContainer(): HTMLElement {
    const name = document.createElement('div');
    name.classList.add('name');
    return name;
}

/**
 * Creates a container which contains the result of a match for a participant.
 */
export function createResultContainer(): HTMLElement {
    const result = document.createElement('div');
    result.classList.add('result');
    return result;
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

    for (const key in firstItem) {
        const prop = key as keyof RankingItem;
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
    nameContainer.title = hint;
}

/**
 * Sets a BYE on a name container.
 *
 * @param nameContainer The name container.
 */
export function setupBye(nameContainer: HTMLElement): void {
    nameContainer.innerText = t('common.bye');
    nameContainer.classList.add('bye');
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
            resultContainer.innerText = t('abbreviations.win');
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
            resultContainer.innerText = t('abbreviations.forfeit');
        else if (participant.score === undefined)
            resultContainer.innerText = t('abbreviations.loss');
    }
}

/**
 * Adds the participant origin to a name.
 *
 * @param nameContainer The name container.
 * @param text The text to set (origin).
 * @param placement The placement of the participant origin.
 */
export function addParticipantOrigin(nameContainer: HTMLElement, text: string, placement: Placement): void {
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
 * Adds the participant image to a name.
 *
 * @param nameContainer The name container.
 * @param src Source of the image.
 */
export function addParticipantImage(nameContainer: HTMLElement, src: string): void {
    const img = document.createElement('img');
    img.src = src;
    nameContainer.prepend(img);
}

/**
 * Returns the connection for a given round in a bracket.
 *
 * @param alwaysConnectFirstRound Whether to always connect the first round with the second round.
 * @param roundNumber Number of the round.
 * @param roundCount Count of rounds.
 * @param match The match to connect to other matches.
 * @param matchLocation Location of the match.
 * @param connectFinal Whether to connect to the final.
 */
export function getBracketConnection(alwaysConnectFirstRound: boolean, roundNumber: number, roundCount: number, match: Match, matchLocation?: GroupType, connectFinal?: boolean): Connection {
    const connection: Connection = {
        connectPrevious: false,
        connectNext: false,
    };

    if (matchLocation === 'loser_bracket') {
        connection.connectPrevious = roundNumber > 1 && (roundNumber % 2 === 1 ? 'square' : 'straight');
        connection.connectNext = roundNumber < roundCount && (roundNumber % 2 === 0 ? 'square' : 'straight');
    } else {
        connection.connectPrevious = roundNumber > 1 && 'square';
        connection.connectNext = roundNumber < roundCount ? 'square' : (connectFinal ? 'straight' : false);
    }

    if (alwaysConnectFirstRound || roundNumber !== 2)
        return connection;

    const upperBracket = matchLocation === 'single_bracket' || matchLocation === 'winner_bracket';

    if (upperBracket && match.opponent1?.position === undefined && match.opponent2?.position === undefined)
        connection.connectPrevious = false;

    if (matchLocation === 'loser_bracket' && match.opponent2?.position === undefined)
        connection.connectPrevious = false;

    return connection;
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
 * @param opponentsContainer The opponents container.
 * @param matchContainer The match container.
 * @param connection The connection to set.
 */
export function setupConnection(opponentsContainer: HTMLElement, matchContainer: HTMLElement, connection: Connection): void {
    if (connection.connectPrevious)
        opponentsContainer.classList.add('connect-previous');

    if (connection.connectNext)
        matchContainer.classList.add('connect-next');

    if (connection.connectPrevious === 'straight')
        opponentsContainer.classList.add('straight');

    if (connection.connectNext === 'straight')
        matchContainer.classList.add('straight');
}
