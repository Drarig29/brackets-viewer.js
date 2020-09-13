import './style.scss';
import { Participant, Match, MatchResults, ParticipantResult, ViewerData, StageType } from "brackets-model";
import { splitBy, getRanking, isMajorRound } from "./helpers";
import * as dom from './dom';

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

        this.participants = data.participants;
        data.participants.map(participant => this.teamRefsDOM[participant.id] = []);

        const matchesByGroup = splitBy(data.matches, 'group_id');

        switch (data.stage.type) {
            case 'round_robin':
                this.renderRoundRobin(root, data.stage.name, matchesByGroup);
                break;
            case 'single_elimination':
            case 'double_elimination':
                this.renderElimination(root, data.stage.name, data.stage.type, matchesByGroup);
                break;
            default:
                throw Error(`Unknown bracket type: ${data.stage.type}`);
        }
    }

    private renderRoundRobin(root: HTMLElement, stageName: string, matchesByGroup: Match[][]) {
        const container = dom.createRoundRobinContainer();

        let groupNumber = 1;

        for (const groupMatches of matchesByGroup) {
            const groupContainer = dom.createGroupContainer(`Group ${groupNumber++}`);
            const matchesByRound = splitBy(groupMatches, 'round_id');

            let roundNumber = 1;

            for (const roundMatches of matchesByRound) {
                const roundContainer = dom.createRoundContainer(`Round ${roundNumber++}`);

                for (const match of roundMatches)
                    roundContainer.append(this.createMatch(match));

                groupContainer.append(roundContainer);
            }

            groupContainer.append(this.createRanking(groupMatches));
            container.append(groupContainer);
        }

        root.append(dom.createTitle(stageName), container);
    }

    private renderElimination(root: HTMLElement, stageName: string, type: StageType, matchesByGroup: Match[][]) {
        root.append(dom.createTitle(stageName));

        if (type === 'single_elimination')
            return this.renderSingleElimination(root, matchesByGroup);

        this.renderDoubleElimination(root, matchesByGroup);
    }

    private renderSingleElimination(root: HTMLElement, matchesByGroup: Match[][]) {
        const hasFinal = matchesByGroup[1] !== undefined;
        this.renderBracket(root, splitBy(matchesByGroup[0], "round_id"), number => `Round ${number}`);

        if (hasFinal)
            this.renderFinal('consolation_final', matchesByGroup[1]);
    }

    private renderDoubleElimination(root: HTMLElement, matchesByGroup: Match[][]) {
        const hasFinal = matchesByGroup[2] !== undefined;
        this.renderBracket(root, splitBy(matchesByGroup[0], "round_id"), number => `WB Round ${number}`, false, hasFinal);
        this.renderBracket(root, splitBy(matchesByGroup[1], "round_id"), number => `LB Round ${number}`, true);

        if (hasFinal)
            this.renderFinal('grand_final', matchesByGroup[2]);
    }

    /**
     * Renders a bracket.
     */
    private renderBracket(root: HTMLElement, matchesByRound: Match[][], roundName: (roundNumber: number) => string, inLowerBracket?: boolean, connectFinal?: boolean) {
        const bracketContainer = dom.createBracketContainer();
        const roundCount = matchesByRound.length;

        let roundNumber = 1;

        for (const matches of matchesByRound) {
            const roundContainer = dom.createRoundContainer(roundName(roundNumber));

            for (const match of matches)
                roundContainer.append(this.createBracketMatch(roundNumber, matchesByRound, match, roundCount, inLowerBracket, connectFinal));

            bracketContainer.append(roundContainer);
            roundNumber++;
        }

        root.append(bracketContainer);
    }

    private renderFinal(type: FinalType, matches: Match[]) {
        const upperBracket = document.querySelector('.bracket');
        if (!upperBracket) throw Error('Upper bracket not found.');

        const grandFinalName = this.getGrandFinalName(matches);

        for (let i = 0; i < matches.length; i++) {
            const roundContainer = dom.createRoundContainer(this.getFinalMatchLabel(type, grandFinalName, i));
            roundContainer.append(this.createFinalMatch(type, grandFinalName, matches, i));
            upperBracket.append(roundContainer);
        }
    }

    private createRanking(matches: Match[]) {
        const table = dom.createTable();
        const ranking = getRanking(matches);

        table.append(dom.createHeaders(ranking));

        for (const item of ranking)
            table.append(this.createRankingItem(item));

        return table;
    }

    private createRankingItem(item: RankingItem) {
        const row = dom.createRow();

        for (const prop in item) {
            let data: number | string = item[prop];

            if (prop === 'id') {
                const participant = this.participants.find(team => team.id === data);

                if (participant !== undefined) {
                    const cell = dom.createCell(participant.name);
                    this.setupMouseHover(participant.id, cell);
                    row.append(cell);
                    continue;
                }
            }

            row.append(dom.createCell(data));
        }

        return row;
    }

    private createBracketMatch(roundNumber: number, matchesByRound: Match[][], match: Match, roundCount: number, inLowerBracket?: boolean, connectFinal?: boolean) {
        const connection = this.getConnection(roundNumber, matchesByRound, inLowerBracket, connectFinal);
        const matchLabel = this.getMatchLabel(match, roundNumber, roundCount, inLowerBracket);
        const matchHint = this.getMatchHint(roundNumber, roundCount, inLowerBracket);
        return this.createMatch(match, connection, matchLabel, matchHint, inLowerBracket);
    }

    private createFinalMatch(type: string, grandFinalName: (i: number) => string, matches: Match[], i: number) {
        const connection: Connection = {
            connectPrevious: type === 'grand_final' && (i === 0 && 'straight'),
            connectNext: matches.length === 2 && i === 0 && 'straight',
        };

        const matchLabel = this.getFinalMatchLabel(type, grandFinalName, i);
        const matchHint = this.getFinalMatchHint(type, i);

        return this.createMatch(matches[i], connection, matchLabel, matchHint);
    }

    private createMatch(results: MatchResults, connection?: Connection, label?: string, hint?: MatchHint, inLowerBracket?: boolean) {
        inLowerBracket = inLowerBracket || false;

        const match = dom.createMatchContainer();
        const teams = dom.createTeamsContainer();

        const team1 = this.createTeam(results.opponent1, hint, inLowerBracket);
        const team2 = this.createTeam(results.opponent2, hint, inLowerBracket);

        if (label)
            teams.append(dom.createMatchLabel(label));

        teams.append(team1, team2);
        match.append(teams);

        if (!connection)
            return match;

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

    private createTeam(team: ParticipantResult | null, hint: MatchHint, inLowerBracket: boolean) {
        const teamContainer = dom.createTeamContainer();
        const nameContainer = dom.createNameContainer();
        const resultContainer = dom.createResultContainer();

        if (team === null)
            nameContainer.innerText = 'BYE';
        else
            this.renderParticipant(nameContainer, resultContainer, team, hint, inLowerBracket);

        teamContainer.append(nameContainer, resultContainer);

        if (team && team.id !== null)
            this.setupMouseHover(team.id, teamContainer);

        return teamContainer;
    }

    private renderParticipant(nameContainer: HTMLElement, resultContainer: HTMLElement, team: ParticipantResult, hint: MatchHint, inLowerBracket: boolean) {
        const participant = this.participants.find(participant => participant.id === team.id);

        if (participant) {
            nameContainer.innerText = participant.name;
            this.renderTeamOrigin(nameContainer, team, inLowerBracket);
        } else if (hint && team.position !== undefined) {
            dom.setupHint(nameContainer, hint(team.position));
        }

        resultContainer.innerText = `${team.score || '-'}`;

        dom.setupWin(nameContainer, resultContainer, team);
        dom.setupLoss(nameContainer, resultContainer, team);
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

    private setupMouseHover(id: number, cell: HTMLElement) {
        this.teamRefsDOM[id].push(cell);

        cell.addEventListener('mouseover', () => {
            this.teamRefsDOM[id].forEach(el => el.classList.add('hover'));
        });

        cell.addEventListener('mouseleave', () => {
            this.teamRefsDOM[id].forEach(el => el.classList.remove('hover'));
        });
    }

    private getMatchHint(roundNumber: number, roundCount: number, inLowerBracket?: boolean): MatchHint {
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

    private getConnection(roundNumber: number, matchesByRound: Match[][], inLowerBracket?: boolean, connectFinal?: boolean): Connection {
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

    private getMatchLabel(match: Match, roundNumber: number, roundCount: number, inLowerBracket?: boolean) {
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

    private getFinalMatchLabel(type: string, grandFinalName: (i: number) => string, i: number) {
        return type === 'consolation_final' ? 'Consolation Final' : grandFinalName(i);
    }

    private getFinalMatchHint(type: string, i: number): MatchHint {
        if (type === 'consolation_final')
            return (i: number) => `Loser of Semi ${i}`;

        if (i === 0)
            return () => 'Winner of LB Final';

        return undefined;
    }

    private getGrandFinalName(matches: Match[]) {
        return matches.length === 1 ? () => 'Grand Final' : (i: number) => `GF Round ${i + 1}`;
    }
}

(window as any).bracketsViewer = new BracketsViewer();