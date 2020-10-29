import './style.scss';
import { Participant, Match, MatchResults, ParticipantResult, StageType } from 'brackets-model';
import { splitBy, getRanking } from './helpers';
import * as dom from './dom';
import * as lang from './lang';
import { Config, Connection, FinalType, OriginHint, RankingItem, ViewerData } from './types';

export class BracketsViewer {

    readonly teamRefsDOM: { [participantId: number]: HTMLElement[] } = {};
    private participants!: Participant[];
    private config!: Config;

    /**
     * Renders a stage (round-robin, single or double elimination).
     *
     * @param rootSelector The DOM selector for the root element.
     * @param data The data to display.
     * @param config An optional configuration for the viewer.
     */
    public render(rootSelector: string, data: ViewerData, config?: Partial<Config>): void {
        const root = document.querySelector(rootSelector) as HTMLElement;
        if (!root) throw Error('Root not found. You must have a root element with id "root"');

        this.config = {
            participantOriginPlacement: config && config.participantOriginPlacement || 'before',
            showSlotsOrigin: config && config.showSlotsOrigin !== undefined ? config.showSlotsOrigin : true,
            showLowerBracketSlotsOrigin: config && config.showLowerBracketSlotsOrigin !== undefined ? config.showLowerBracketSlotsOrigin : true,
            highlightParticipantOnHover: config && config.highlightParticipantOnHover !== undefined ? config.highlightParticipantOnHover : true,
        };

        this.participants = data.participants;
        data.participants.forEach(participant => this.teamRefsDOM[participant.id] = []);

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

    /**
     * Renders a round-robin stage.
     *
     * @param root The root element.
     * @param stageName Name of the stage.
     * @param matchesByGroup A list of matches for each group.
     */
    private renderRoundRobin(root: HTMLElement, stageName: string, matchesByGroup: Match[][]): void {
        const container = dom.createRoundRobinContainer();

        let groupNumber = 1;

        for (const groupMatches of matchesByGroup) {
            const groupContainer = dom.createGroupContainer(lang.getGroupName(groupNumber++));
            const matchesByRound = splitBy(groupMatches, 'round_id');

            let roundNumber = 1;

            for (const roundMatches of matchesByRound) {
                const roundContainer = dom.createRoundContainer(lang.getRoundName(roundNumber++));

                for (const match of roundMatches)
                    roundContainer.append(this.createMatch(match));

                groupContainer.append(roundContainer);
            }

            groupContainer.append(this.createRanking(groupMatches));
            container.append(groupContainer);
        }

        root.append(dom.createTitle(stageName), container);
    }

    /**
     * Renders an elimination stage (single or double).
     *
     * @param root The root element.
     * @param stageName Name of the stage.
     * @param type Type of the stage.
     * @param matchesByGroup A list of matches for each group.
     */
    private renderElimination(root: HTMLElement, stageName: string, type: StageType, matchesByGroup: Match[][]): void {
        root.append(dom.createTitle(stageName));

        if (type === 'single_elimination')
            this.renderSingleElimination(root, matchesByGroup);
        else
            this.renderDoubleElimination(root, matchesByGroup);
    }

    /**
     * Renders a single elimination stage.
     *
     * @param root The root element.
     * @param matchesByGroup A list of matches for each group.
     */
    private renderSingleElimination(root: HTMLElement, matchesByGroup: Match[][]): void {
        const hasFinal = matchesByGroup[1] !== undefined;
        this.renderBracket(root, splitBy(matchesByGroup[0], 'round_id'), lang.getRoundName);

        if (hasFinal)
            this.renderFinal('consolation_final', matchesByGroup[1]);
    }

    /**
     * Renders a double elimination stage.
     *
     * @param root The root element.
     * @param matchesByGroup A list of matches for each group.
     */
    private renderDoubleElimination(root: HTMLElement, matchesByGroup: Match[][]): void {
        const hasFinal = matchesByGroup[2] !== undefined;
        this.renderBracket(root, splitBy(matchesByGroup[0], 'round_id'), lang.getWinnerBracketRoundName, false, hasFinal);
        this.renderBracket(root, splitBy(matchesByGroup[1], 'round_id'), lang.getLoserBracketRoundName, true);

        if (hasFinal)
            this.renderFinal('grand_final', matchesByGroup[2]);
    }

    /**
     * Renders a bracket.
     *
     * @param root The root element.
     * @param matchesByRound A list of matches for each round.
     * @param roundName A function giving a round's name based on its number.
     * @param inLowerBracket Whether the bracket is in lower bracket.
     * @param connectFinal Whether to connect the last match of the bracket to the final.
     */
    private renderBracket(root: HTMLElement, matchesByRound: Match[][], roundName: (roundNumber: number) => string, inLowerBracket?: boolean, connectFinal?: boolean): void {
        const bracketContainer = dom.createBracketContainer();
        const roundCount = matchesByRound.length;

        let roundNumber = 1;

        for (const matches of matchesByRound) {
            const roundContainer = dom.createRoundContainer(roundName(roundNumber));

            for (const match of matches)
                roundContainer.append(this.createBracketMatch(roundNumber, roundCount, match, inLowerBracket, connectFinal));

            bracketContainer.append(roundContainer);
            roundNumber++;
        }

        root.append(bracketContainer);
    }

    /**
     * Renders a final group.
     *
     * @param finalType Type of the final.
     * @param matches Matches of the final.
     */
    private renderFinal(finalType: FinalType, matches: Match[]): void {
        const upperBracket = document.querySelector('.bracket');
        if (!upperBracket) throw Error('Upper bracket not found.');

        const winnerWb = matches[0].opponent1;
        const finalsToDisplay = (winnerWb && winnerWb.id != null && winnerWb.result != "win") ? 2 : 1;
        const finalMatches = matches.slice(0, finalsToDisplay);

        const roundCount = matches.length;

        for (let roundNumber = 1; roundNumber <= finalMatches.length; roundNumber++) {
            const roundContainer = dom.createRoundContainer(lang.getFinalMatchLabel(finalType, roundNumber, roundCount));
            roundContainer.append(this.createFinalMatch(finalType, finalMatches, roundNumber, roundCount));
            upperBracket.append(roundContainer);
        }
    }

    /**
     * Creates a ranking table based on matches of a round-robin stage.
     *
     * @param matches The list of matches.
     */
    private createRanking(matches: Match[]): HTMLElement {
        const table = dom.createTable();
        const ranking = getRanking(matches);

        table.append(dom.createRankingHeaders(ranking));

        for (const item of ranking)
            table.append(this.createRankingRow(item));

        return table;
    }

    /**
     * Creates a row of the ranking table.
     *
     * @param item Item of the ranking.
     */
    private createRankingRow(item: RankingItem): HTMLElement {
        const row = dom.createRow();

        for (const prop in item) {
            const data: number | string = item[prop];

            if (prop === 'id') {
                const participant = this.participants.find(participant => participant.id === data);

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

    /**
     * Creates a match in a bracket.
     *
     * @param roundNumber Number of the round.
     * @param roundCount Count of rounds.
     * @param match Information about the match.
     * @param inLowerBracket Whether the match is in lower bracket.
     * @param connectFinal Whether to connect this match to the final if it happens to be the last one of the bracket.
     */
    private createBracketMatch(roundNumber: number, roundCount: number, match: Match, inLowerBracket?: boolean, connectFinal?: boolean): HTMLElement {
        const connection = dom.getBracketConnection(roundNumber, roundCount, inLowerBracket, connectFinal);
        const matchLabel = lang.getMatchLabel(match.number, roundNumber, roundCount, inLowerBracket);
        const originHint = lang.getOriginHint(roundNumber, roundCount, inLowerBracket);
        return this.createMatch(match, connection, matchLabel, originHint, inLowerBracket);
    }

    /**
     * Creates a match in a final.
     *
     * @param type Type of the final.
     * @param matches Matches of the final.
     * @param roundNumber Number of the round.
     * @param roundCount Count of rounds.
     */
    private createFinalMatch(type: FinalType, matches: Match[], roundNumber: number, roundCount: number): HTMLElement {
        const roundIndex = roundNumber - 1;
        const connection = dom.getFinalConnection(type, roundNumber, matches.length);
        const matchLabel = lang.getFinalMatchLabel(type, roundNumber, roundCount);
        const originHint = lang.getFinalOriginHint(type, roundNumber);
        return this.createMatch(matches[roundIndex], connection, matchLabel, originHint);
    }

    /**
     * Creates a match based on its results.
     *
     * @param results Results of the match.
     * @param connection Connection of this match with the others.
     * @param label Label of the match.
     * @param originHint Origin hint for the match.
     * @param inLowerBracket Whether the match is in lower bracket.
     */
    private createMatch(results: MatchResults, connection?: Connection, label?: string, originHint?: OriginHint, inLowerBracket?: boolean): HTMLElement {
        inLowerBracket = inLowerBracket || false;

        const match = dom.createMatchContainer();
        const opponents = dom.createOpponentsContainer();

        const team1 = this.createTeam(results.opponent1, originHint, inLowerBracket);
        const team2 = this.createTeam(results.opponent2, originHint, inLowerBracket);

        if (label)
            opponents.append(dom.createMatchLabel(label, lang.getMatchStatus(results.status)));

        opponents.append(team1, team2);
        match.append(opponents);

        if (!connection)
            return match;

        dom.setupConnection(opponents, match, connection);

        return match;
    }

    /**
     * Creates a participant for a match.
     *
     * @param participant Information about the participant.
     * @param originHint Origin hint for the match.
     * @param inLowerBracket Whether the match is in lower bracket.
     */
    private createTeam(participant: ParticipantResult | null, originHint: OriginHint, inLowerBracket: boolean): HTMLElement {
        const participantContainer = dom.createParticipantContainer();
        const nameContainer = dom.createNameContainer();
        const resultContainer = dom.createResultContainer();

        if (participant === null)
            nameContainer.innerText = 'BYE';
        else
            this.renderParticipant(participantContainer, nameContainer, resultContainer, participant, originHint, inLowerBracket);

        participantContainer.append(nameContainer, resultContainer);

        if (participant && participant.id !== null)
            this.setupMouseHover(participant.id, participantContainer);

        return participantContainer;
    }

    /**
     * Renders a participant.
     *
     * @param participantContainer The participant container.
     * @param nameContainer The name container.
     * @param resultContainer The result container.
     * @param participant The participant result.
     * @param originHint Origin hint for the match.
     * @param inLowerBracket Whether the match is in lower bracket.
     */
    private renderParticipant(participantContainer: HTMLElement, nameContainer: HTMLElement, resultContainer: HTMLElement, participant: ParticipantResult, originHint: OriginHint, inLowerBracket: boolean): void {
        const found = this.participants.find(item => item.id === participant.id);

        if (found) {
            nameContainer.innerText = found.name;
            this.renderTeamOrigin(nameContainer, participant, inLowerBracket);
        } else
            this.renderHint(nameContainer, participant, originHint, inLowerBracket);

        resultContainer.innerText = `${participant.score || '-'}`;

        dom.setupWin(participantContainer, resultContainer, participant);
        dom.setupLoss(participantContainer, resultContainer, participant);
    }

    /**
     * Renders an origin hint for a participant.
     *
     * @param nameContainer The name container.
     * @param participant The participant result.
     * @param originHint Origin hint for the participant.
     * @param inLowerBracket Whether the match is in lower bracket.
     */
    private renderHint(nameContainer: HTMLElement, participant: ParticipantResult, originHint: OriginHint, inLowerBracket: boolean): void {
        if (originHint === undefined || participant.position === undefined) return;
        if (!this.config.showSlotsOrigin) return;
        if (!this.config.showLowerBracketSlotsOrigin && inLowerBracket) return;

        dom.setupHint(nameContainer, originHint(participant.position));
    }

    /**
     * Renders a participant's origin.
     *
     * @param nameContainer The name container.
     * @param participant The participant result.
     * @param inLowerBracket Whether the match is in lower bracket.
     */
    private renderTeamOrigin(nameContainer: HTMLElement, participant: ParticipantResult, inLowerBracket: boolean): void {
        if (participant.position === undefined) return;
        if (this.config.participantOriginPlacement === 'none') return;
        if (!this.config.showSlotsOrigin) return;
        if (!this.config.showLowerBracketSlotsOrigin && inLowerBracket) return;

        const origin = (inLowerBracket ? lang.abbreviations.position : lang.abbreviations.seed) + participant.position;
        dom.addTeamOrigin(nameContainer, origin, this.config.participantOriginPlacement);
    }

    /**
     * Sets mouse hover events for a participant.
     *
     * @param participantId ID of the participant.
     * @param element The dom element to add events to. 
     */
    private setupMouseHover(participantId: number, element: HTMLElement): void {
        if (!this.config.highlightParticipantOnHover) return;

        this.teamRefsDOM[participantId].push(element);

        element.addEventListener('mouseover', () => {
            this.teamRefsDOM[participantId].forEach(el => el.classList.add('hover'));
        });

        element.addEventListener('mouseleave', () => {
            this.teamRefsDOM[participantId].forEach(el => el.classList.remove('hover'));
        });
    }
}

window.bracketsViewer = new BracketsViewer();