import { ParticipantResult } from "brackets-model";
import { rankingHeader } from "./helpers";

export function createResultContainer() {
    const resultDOM = document.createElement('div');
    resultDOM.classList.add('result');
    return resultDOM;
}

export function createNameContainer() {
    const nameDOM = document.createElement('div');
    nameDOM.classList.add('name');
    return nameDOM;
}

export function createTeamContainer() {
    const teamDOM = document.createElement('div');
    teamDOM.classList.add('team');
    return teamDOM;
}

export function createMatchContainer() {
    const match = document.createElement('div');
    match.classList.add('match');
    return match;
}

export function createMatchLabel(label: string) {
    const span = document.createElement('span');
    span.innerText = label;
    return span;
}

export function createTeamsContainer() {
    const teams = document.createElement('div');
    teams.classList.add('teams');
    return teams;
}

export function createBracketContainer() {
    const bracket = document.createElement('section');
    bracket.classList.add('bracket');
    return bracket;
}

export function createCell(text: string): HTMLTableDataCellElement;
export function createCell(data: number): HTMLTableDataCellElement;

export function createCell(data: string | number) {
    const td = document.createElement('td');
    td.innerText = String(data);
    return td;
}

export function createRow() {
    return document.createElement('tr');
}

export function createHeaders(ranking: Ranking) {
    const headers = document.createElement('tr');
    const firstItem = ranking[0];

    for (const prop in firstItem) {
        const header = rankingHeader(prop as any);
        const th = document.createElement('th');
        th.innerText = header.value;
        th.setAttribute('title', header.tooltip);
        headers.append(th);
    }

    return headers;
}

export function createTable() {
    return document.createElement('table');
}

export function createTitle(title: string) {
    const h1 = document.createElement('h1');
    h1.innerText = title;
    return h1;
}

export function createRoundContainer(title: string) {
    const h3 = document.createElement('h3');
    h3.innerText = title;

    const roundDOM = document.createElement('article');
    roundDOM.classList.add('round');
    roundDOM.append(h3);
    return roundDOM;
}

export function createRoundRobinContainer() {
    const container = document.createElement('div');
    container.classList.add('round-robin');
    return container;
}

export function createGroupContainer(title: string) {
    const h2 = document.createElement('h2');
    h2.innerText = title;

    const groupDOM = document.createElement('section');
    groupDOM.classList.add('group');
    groupDOM.append(h2);
    return groupDOM;
}

export function setupHint(nameContainer: HTMLElement, hint: string) {
    nameContainer.classList.add('hint');
    nameContainer.innerText = hint;
}

export function setupWin(nameContainer: HTMLElement, resultContainer: HTMLElement, team: ParticipantResult) {
    if (team.result && team.result === 'win') {
        nameContainer.classList.add('win');
        resultContainer.classList.add('win');

        if (team.score === undefined)
            resultContainer.innerText = 'W';
    }
}

export function setupLoss(nameContainer: HTMLElement, resultContainer: HTMLElement, team: ParticipantResult) {
    if (team.result && team.result === 'loss' || team.forfeit) {
        nameContainer.classList.add('loss');
        resultContainer.classList.add('loss');

        if (team.forfeit)
            resultContainer.innerText = 'F'; // Forfeit.
        else if (team.score === undefined)
            resultContainer.innerText = 'L';
    }
}