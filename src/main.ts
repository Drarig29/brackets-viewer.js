import './style.scss';
import { Participant, Match, MatchResults, ParticipantResult, ViewerData } from "brackets-model";
import { splitBy, getRanking, rankingHeader, isMajorRound } from "./helpers";

class BracketsViewer {

    readonly teamRefsDOM: { [key: number]: HTMLElement[] } = {};
    private participants!: Participant[];
    private config!: Config;

    public render(rootSelector: string, data: ViewerData, config?: Config) {
        const root = document.querySelector(rootSelector) as HTMLElement;
        if (!root) throw Error('Root not found. You must have a root element with id "root"');

        this.config = {
            participantOriginPlacement: config && config.participantOriginPlacement || 'before',
            showSlotsOrigin: config && config.showSlotsOrigin || true,
            showLowerBracketSlotsOrigin: config && config.showLowerBracketSlotsOrigin || false,
        };

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
    private renderBracket(root: HTMLElement, matchesByRound: Match[][], roundName: (roundNumber: number) => string, inLowerBracket?: boolean, connectFinal?: boolean) {
        const roundCount = matchesByRound.length;
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
                const connection = this.getConnection(inLowerBracket, roundNumber, matchesByRound, connectFinal);
                const matchLabel = this.getMatchLabel(match, roundNumber, roundCount, inLowerBracket);
                const matchHint = this.getMatchHint(inLowerBracket, roundNumber, roundCount);

                roundDOM.append(this.renderMatch(match, connection, matchLabel, matchHint, inLowerBracket));
            }

            bracket.append(roundDOM);
            roundNumber++;
        }

        root.append(bracket);
    }

    private getMatchHint(inLowerBracket: boolean | undefined, roundNumber: number, roundCount: number): MatchHint {
        if (!inLowerBracket && roundNumber === 1)
            return (i: number) => `Seed ${i}`;

        if (inLowerBracket && isMajorRound(roundNumber)) {
            const roundNumberWB = Math.ceil((roundNumber + 1) / 2);

            let hint = (i: number) => `Loser of WB ${roundNumberWB}.${i}`;

            if (roundNumber === roundCount - 2)
                hint = (i: number) => `Loser of WB Semi ${i}`;

            if (roundNumber === roundCount)
                hint = () => 'Loser of WB Final';

            return hint;
        }

        return undefined;
    }

    private getConnection(inLowerBracket: boolean | undefined, roundNumber: number, matchesByRound: Match[][], connectFinal: boolean | undefined): Connection {
        if (inLowerBracket) {
            return {
                connectPrevious: roundNumber > 1 && (roundNumber % 2 === 1 ? 'square' : 'straight'),
                connectNext: roundNumber < matchesByRound.length && (roundNumber % 2 === 0 ? 'square' : 'straight'),
            };
        }

        return {
            connectPrevious: roundNumber > 1 && 'square',
            connectNext: roundNumber < matchesByRound.length ? 'square' : (connectFinal ? 'straight' : false),
        }
    }

    private getMatchLabel(match: Match, roundNumber: number, roundCount: number, inLowerBracket: boolean | undefined) {
        let matchPrefix = 'M';

        if (inLowerBracket)
            matchPrefix = 'LB';
        else if (inLowerBracket === false)
            matchPrefix = 'WB';

        const semiFinalRound = roundNumber === roundCount - 1;
        const finalRound = roundNumber === roundCount;

        let matchLabel = `${matchPrefix} ${roundNumber}.${match.number}`;

        if (!inLowerBracket && semiFinalRound)
            matchLabel = `Semi ${match.number}`;

        if (finalRound)
            matchLabel = 'Final';

        return matchLabel;
    }

    private renderFinal(type: FinalType, matches: Match[]) {
        const upperBracket = document.querySelector('.bracket');
        if (!upperBracket) throw Error('Upper bracket not found.');

        const grandFinalMatchHint = (i: number) => i === 0 ? () => 'Winner of LB Final' : undefined;
        const grandFinalName = matches.length === 1 ? () => 'Grand Final' : (i: number) => `GF Round ${i + 1}`;

        for (let i = 0; i < matches.length; i++) {
            const matchLabel = type === 'consolation_final' ? 'Consolation Final' : grandFinalName(i);
            const matchHint = type === 'consolation_final' ? (i: number) => `Loser of Semi ${i}` : grandFinalMatchHint(i);

            const matchDOM = this.renderMatch(matches[i], {
                connectPrevious: type === 'grand_final' && (i === 0 && 'straight'),
                connectNext: matches.length === 2 && i === 0 && 'straight',
            }, matchLabel, matchHint, undefined);

            const h3 = document.createElement('h3');
            h3.innerText = type === 'grand_final' ? grandFinalName(i) : 'Consolation Final';

            const roundDOM = document.createElement('article');
            roundDOM.classList.add('round');
            roundDOM.append(h3, matchDOM);

            upperBracket.append(roundDOM);
        }
    }

    private renderMatch(results: MatchResults, connection?: Connection, label?: string, hint?: MatchHint, inLowerBracket?: boolean) {
        inLowerBracket = inLowerBracket || false;

        const team1 = this.renderTeam(results.opponent1, hint, inLowerBracket);
        const team2 = this.renderTeam(results.opponent2, hint, inLowerBracket);

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

    private renderTeam(team: ParticipantResult | null, hint: MatchHint, inLowerBracket: boolean) {
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

            if (participant) {
                nameDOM.innerText = participant.name;
                this.renderTeamOrigin(nameDOM, team, inLowerBracket);
            } else if (hint && team.position) {
                this.renderHint(nameDOM, hint(team.position));
            }

            resultDOM.innerText = team.score === undefined ? '-' : String(team.score);

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

    private renderHint(name: HTMLElement, hint: string) {
        name.classList.add('hint');
        name.innerText = hint;
    }

    private renderTeamOrigin(name: HTMLElement, team: ParticipantResult, inLowerBracket: boolean) {
        if (team.position === undefined) return;
        if (this.config.participantOriginPlacement === 'none') return;
        if (!this.config.showSlotsOrigin) return;
        if (!this.config.showLowerBracketSlotsOrigin && inLowerBracket) return;

        // 'P' for position (where the participant comes from) and '#' for actual seeding.
        const text = inLowerBracket ? `P${team.position}` : `#${team.position}`;

        this.addTeamOrigin(name, text, this.config.participantOriginPlacement);
    }

    private addTeamOrigin(name: HTMLElement, text: string, placement: Placement) {
        const span = document.createElement('span');
        
        if (placement === 'before') {
            span.innerText = `${text} `;
            name.prepend(span);
        } else {
            span.innerText = ` (${text})`;
            name.append(span);
        }
    }
}

(window as any).bracketsViewer = new BracketsViewer();