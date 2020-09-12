import './style.scss';
import { Participant, Match, MatchResults, ParticipantResult, ViewerData } from "brackets-model";
import { splitBy, getRanking, rankingHeader } from "./helpers";

type ConnectionType = 'square' | 'straight' | false;

interface Connection {
    connectPrevious?: ConnectionType,
    connectNext?: ConnectionType,
}

class BracketsViewer {

    readonly teamRefsDOM: { [key: number]: HTMLElement[] } = {};
    private participants!: Participant[];

    public render(rootSelector: string, data: ViewerData) {
        const root = document.querySelector(rootSelector) as HTMLElement;

        if (!root) {
            throw Error('Root not found. You must have a root element with id "root"')
        }

        switch (data.stage.type) {
            case 'round_robin':
                this.renderRoundRobin(root, data);
                break;
            case 'single_elimination':
            case 'double_elimination':
                this.renderElimination(root, data);
                break;
            default:
                throw Error(`Unknown bracket type: ${data.stage.type}`);
        }
    }

    private renderRoundRobin(root: HTMLElement, data: ViewerData) {
        data.participants.map(participant => this.teamRefsDOM[participant.id] = []);

        this.participants = data.participants;

        const container = document.createElement('div');
        container.classList.add('round-robin');
        let groupNumber = 1;

        for (const group of splitBy(data.matches, 'group_id')) {
            const h2 = document.createElement('h2');
            h2.innerText = `Group ${groupNumber++}`;
            const groupDOM = document.createElement('section');
            groupDOM.classList.add('group');
            groupDOM.append(h2);
            let roundNumber = 1;

            for (const round of splitBy(group, 'round_id')) {
                const h3 = document.createElement('h3');
                h3.innerText = `Round ${roundNumber}`;
                const roundDOM = document.createElement('article');
                roundDOM.classList.add('round');
                roundDOM.append(h3);

                for (const match of round) {
                    roundDOM.append(this.renderMatch(match));
                }

                groupDOM.append(roundDOM);
                roundNumber++;
            }

            groupDOM.append(this.renderTable(group));
            container.append(groupDOM);
        }

        const h1 = document.createElement('h1');
        h1.innerText = data.stage.name;
        root.append(h1, container);
    }

    private renderTable(matches: Match[]) {
        const rankings = getRanking(matches);
        const table = document.createElement('table');
        const headers = document.createElement('tr');

        for (const prop in rankings[0]) {
            const header = rankingHeader(prop as any);
            const th = document.createElement('th');
            th.innerText = header.value;
            th.setAttribute('title', header.tooltip);
            headers.append(th);
        }

        table.append(headers);

        for (const ranking of rankings) {
            const row = document.createElement('tr');

            for (const prop in ranking) {
                let data: number | string = ranking[prop];

                if (prop === 'id') {
                    const participant = this.participants.find(team => team.id === data);

                    if (participant !== undefined) {
                        const cell = document.createElement('td');
                        cell.innerText = participant.name;
                        const id = participant.id;

                        this.teamRefsDOM[id].push(cell);
                        cell.addEventListener('mouseover', () => {
                            this.teamRefsDOM[id].forEach(el => el.classList.add('hover'));
                        });
                        cell.addEventListener('mouseleave', () => {
                            this.teamRefsDOM[id].forEach(el => el.classList.remove('hover'));
                        });

                        row.append(cell);
                        continue;
                    }
                }

                const td = document.createElement('td');
                td.innerText = String(data);
                row.append(td);
            }

            table.append(row);
        }

        return table;
    }

    private renderElimination(root: HTMLElement, data: ViewerData) {
        data.participants.map(participant => this.teamRefsDOM[participant.id] = []);

        const matchesByGroup = splitBy(data.matches, 'group_id');
        this.participants = data.participants;

        const h1 = document.createElement('h1');
        h1.innerText = data.stage.name;
        root.append(h1);

        if (data.stage.type === 'single_elimination') {
            const hasFinal = !!matchesByGroup[1];
            this.renderBracket(root, splitBy(matchesByGroup[0], "round_id"), number => `Round ${number}`);

            if (hasFinal) {
                this.renderFinal('consolation_final', matchesByGroup[1]);
            }
        } else if (data.stage.type === 'double_elimination') {
            const hasFinal = !!matchesByGroup[2];
            this.renderBracket(root, splitBy(matchesByGroup[0], "round_id"), number => `WB Round ${number}`, false, hasFinal);
            this.renderBracket(root, splitBy(matchesByGroup[1], "round_id"), number => `LB Round ${number}`, true);

            if (hasFinal) {
                this.renderFinal('grand_final', matchesByGroup[2]);
            }
        }
    }

    /**
     * Renders a bracket.
     */
    private renderBracket(root: HTMLElement, matchesByRound: Match[][], roundName: (roundNumber: number) => string, lowerBracket?: boolean, connectFinal?: boolean) {
        const bracket = document.createElement('section');
        bracket.classList.add('bracket');

        let roundNumber = 1;

        for (const matches of matchesByRound) {
            const h3 = document.createElement('h3');
            h3.innerText = roundName(roundNumber);
            const roundDOM = document.createElement('article');
            roundDOM.classList.add('round');
            roundDOM.append(h3);

            for (const match of matches) {
                let connection: Connection;

                if (lowerBracket) {
                    connection = {
                        connectPrevious: roundNumber > 1 && (roundNumber % 2 === 1 ? 'square' : 'straight'),
                        connectNext: roundNumber < matchesByRound.length && (roundNumber % 2 === 0 ? 'square' : 'straight'),
                    };
                } else {
                    connection = {
                        connectPrevious: roundNumber > 1 && 'square',
                        connectNext: roundNumber < matchesByRound.length ? 'square' : (connectFinal ? 'straight' : false),
                    };
                }

                roundDOM.append(this.renderMatch(match, connection, `M ${roundNumber}.${match.number}`));
            }

            bracket.append(roundDOM);
            roundNumber++;
        }

        root.append(bracket);
    }

    private renderFinal(type: 'consolation_final' | 'grand_final', matches: Match[]) {
        const upperBracket = document.querySelector('.bracket');
        const grandFinalName = matches.length === 1 ? () => 'Grand Final' : (i: number) => `Grand Final R${i + 1}`;

        for (let i = 0; i < matches.length; i++) {
            const matchDOM = this.renderMatch(matches[i], {
                connectPrevious: type === 'grand_final' && (i === 0 && 'straight'),
                connectNext: matches.length === 2 && i === 0 && 'straight',
            });

            const h3 = document.createElement('h3');
            h3.innerText = type === 'grand_final' ? grandFinalName(i) : 'Consolation Final';
            const roundDOM = document.createElement('article');
            roundDOM.classList.add('round');
            roundDOM.append(h3, matchDOM);

            if (upperBracket) upperBracket.append(roundDOM);
        }
    }

    private renderMatch(results: MatchResults, connection?: Connection, label?: string) {
        const team1 = this.renderTeam(results.opponent1);
        const team2 = this.renderTeam(results.opponent2);

        const teams = document.createElement('div');
        teams.classList.add('teams');

        if (label) {
            const span = document.createElement('span');
            span.innerText = label;
            teams.append(span);
        }

        teams.append(team1, team2);

        const match = document.createElement('div');
        match.classList.add('match');
        match.append(teams);
        if (!connection) return match;

        if (connection.connectPrevious)
            teams.classList.add('connect-previous');

        if (connection.connectNext)
            match.classList.add('connect-next');

        if (connection.connectPrevious === 'straight')
            teams.classList.add('straight');

        if (connection.connectNext === 'straight')
            match.classList.add('straight');

        return match;
    }

    private renderTeam(team: ParticipantResult | null) {
        const teamDOM = document.createElement('div');
        teamDOM.classList.add('team');
        const nameDOM = document.createElement('div');
        nameDOM.classList.add('name');
        const resultDOM = document.createElement('div');
        resultDOM.classList.add('result');

        if (team === null) {
            nameDOM.innerText = 'BYE';
        } else {
            const participant = this.participants.find(participant => participant.id === team.id);

            nameDOM.innerText = participant === undefined ? 'TBD' : participant.name;
            resultDOM.innerText = team.score === undefined ? '-' : String(team.score);

            if (team.position !== undefined) {
                const span = document.createElement('span');
                span.innerText = ` (#${team.position})`;
                nameDOM.append(span);
            }

            if (team.result && team.result === 'win') {
                nameDOM.classList.add('win');
                resultDOM.classList.add('win');

                if (team.score === undefined)
                    resultDOM.innerText = 'W'; // Win.
            }

            if (team.result && team.result === 'loss' || team.forfeit) {
                nameDOM.classList.add('loss');
                resultDOM.classList.add('loss');

                if (team.forfeit)
                    resultDOM.innerText = 'F'; // Forfeit.
                else if (team.score === undefined)
                    resultDOM.innerText = 'L'; // Loss.
            }
        }

        teamDOM.append(nameDOM, resultDOM);

        if (team && team.id !== null) {
            const id = team.id;
            this.teamRefsDOM[id].push(teamDOM);
            teamDOM.addEventListener('mouseover', () => {
                this.teamRefsDOM[id].forEach(el => el.classList.add('hover'));
            });
            teamDOM.addEventListener('mouseleave', () => {
                this.teamRefsDOM[id].forEach(el => el.classList.remove('hover'));
            });
        }

        return teamDOM;
    }
}

(window as any).bracketsViewer = new BracketsViewer();