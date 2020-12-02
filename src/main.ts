import './style.scss';
import { Participant, Match, MatchResults, ParticipantResult, StageType } from 'brackets-model';
import { splitBy, getRanking, getOriginAbbreviation } from './helpers';
import * as dom from './dom';
import * as lang from './lang';
import {
    Config,
    Connection,
    FinalType,
    BracketType,
    OriginHint,
    ParticipantContainers,
    RankingItem,
    RoundName,
    ViewerData,
} from './types';

export class BracketsViewer {

    readonly teamRefsDOM: { [participantId: number]: HTMLElement[] } = {};
    private participants!: Participant[];
    private config!: Config;
    private skipFirstRound!: boolean;

    /**
     * Renders a stage (round-robin, single or double elimination).
     *
     * @param data The data to display.
     * @param config An optional configuration for the viewer.
     */
    public render(data: ViewerData, config?: Partial<Config>): void {
        const root = document.querySelector('.bracket-viewer') as HTMLElement;
        if (!root) throw Error('Root not found. You must have a root element with class "bracket-viewer".');

        this.config = {
            participantOriginPlacement: config && config.participantOriginPlacement || 'before',
            showSlotsOrigin: config && config.showSlotsOrigin !== undefined ? config.showSlotsOrigin : true,
            showLowerBracketSlotsOrigin: config && config.showLowerBracketSlotsOrigin !== undefined ? config.showLowerBracketSlotsOrigin : true,
            highlightParticipantOnHover: config && config.highlightParticipantOnHover !== undefined ? config.highlightParticipantOnHover : true,
        };

        this.skipFirstRound = data.stage.settings.skipFirstRound || false;

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
            const groupId = groupMatches[0].group_id;
            const groupContainer = dom.createGroupContainer(groupId, lang.getGroupName(groupNumber++));
            const matchesByRound = splitBy(groupMatches, 'round_id');

            let roundNumber = 1;

            for (const roundMatches of matchesByRound) {
                const roundId = roundMatches[0].round_id;
                const roundContainer = dom.createRoundContainer(roundId, lang.getRoundName(roundNumber++, 0));

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
        this.renderBracket(root, splitBy(matchesByGroup[0], 'round_id'), lang.getRoundName, 'single-bracket');

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
        const hasLoserBracket = matchesByGroup[1] !== undefined;
        const hasFinal = matchesByGroup[2] !== undefined;

        this.renderBracket(root, splitBy(matchesByGroup[0], 'round_id'), lang.getWinnerBracketRoundName, 'winner-bracket', hasFinal);

        if (hasLoserBracket)
            this.renderBracket(root, splitBy(matchesByGroup[1], 'round_id'), lang.getLoserBracketRoundName, 'loser-bracket');

        if (hasFinal)
            this.renderFinal('grand_final', matchesByGroup[2]);
    }

    /**
     * Renders a bracket.
     *
     * @param root The root element.
     * @param matchesByRound A list of matches for each round.
     * @param roundName A function giving a round's name based on its number.
     * @param bracketType Type of the bracket.
     * @param connectFinal Whether to connect the last match of the bracket to the final.
     */
    private renderBracket(root: HTMLElement, matchesByRound: Match[][], roundName: RoundName, bracketType: BracketType, connectFinal?: boolean): void {
        const groupId = matchesByRound[0][0].group_id;
        const roundCount = matchesByRound.length;
        const bracketContainer = dom.createBracketContainer(groupId);

        let roundNumber = 1;

        for (const matches of matchesByRound) {
            const roundId = matches[0].round_id;
            const roundContainer = dom.createRoundContainer(roundId, roundName(roundNumber, roundCount));

            for (const match of matches)
                roundContainer.append(this.createBracketMatch(roundNumber, roundCount, match, bracketType, connectFinal));

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
        const displayCount = winnerWb?.id === null || winnerWb?.result === 'win' ? 1 : 2;
        const finalMatches = matches.slice(0, displayCount);

        const roundCount = matches.length;

        for (let roundIndex = 0; roundIndex < finalMatches.length; roundIndex++) {
            const roundNumber = roundIndex + 1;
            const roundContainer = dom.createRoundContainer(finalMatches[roundIndex].round_id, lang.getFinalMatchLabel(finalType, roundNumber, roundCount));
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
            const data = item[prop];

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
     * @param matchLocation Location of the match.
     * @param connectFinal Whether to connect this match to the final if it happens to be the last one of the bracket.
     */
    private createBracketMatch(roundNumber: number, roundCount: number, match: Match, matchLocation: BracketType, connectFinal?: boolean): HTMLElement {
        const connection = dom.getBracketConnection(roundNumber, roundCount, matchLocation, connectFinal);
        const matchLabel = lang.getMatchLabel(match.number, roundNumber, roundCount, matchLocation);
        const originHint = lang.getOriginHint(roundNumber, roundCount, this.skipFirstRound, matchLocation);
        return this.createMatch(match, matchLocation, connection, matchLabel, originHint, roundNumber);
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
        return this.createMatch(matches[roundIndex], 'final-group', connection, matchLabel, originHint);
    }

    /**
     * Creates a match based on its results.
     *
     * @param match Results of the match.
     * @param matchLocation Location of the match.
     * @param connection Connection of this match with the others.
     * @param label Label of the match.
     * @param originHint Origin hint for the match.
     * @param roundNumber Number of the round.
     */
    private createMatch(match: MatchResults, matchLocation?: BracketType, connection?: Connection, label?: string, originHint?: OriginHint, roundNumber?: number): HTMLElement {
        const matchContainer = dom.createMatchContainer(match.id);
        const opponents = dom.createOpponentsContainer();

        const team1 = this.createTeam(match.opponent1, originHint, matchLocation, roundNumber);
        const team2 = this.createTeam(match.opponent2, originHint, matchLocation, roundNumber);

        if (label)
            opponents.append(dom.createMatchLabel(label, lang.getMatchStatus(match.status)));

        opponents.append(team1, team2);
        matchContainer.append(opponents);

        if (!connection)
            return matchContainer;

        dom.setupConnection(opponents, matchContainer, connection);

        return matchContainer;
    }

    /**
     * Creates a participant for a match.
     *
     * @param participant Information about the participant.
     * @param originHint Origin hint for the match.
     * @param matchLocation Location of the match.
     * @param roundNumber Number of the round.
     */
    private createTeam(participant: ParticipantResult | null, originHint: OriginHint, matchLocation?: BracketType, roundNumber?: number): HTMLElement {
        const containers: ParticipantContainers = {
            participant: dom.createParticipantContainer(participant && participant.id),
            name: dom.createNameContainer(),
            result: dom.createResultContainer(),
        };

        if (participant === null)
            containers.name.innerText = 'BYE';
        else
            this.renderParticipant(containers, participant, originHint, matchLocation, roundNumber);

        containers.participant.append(containers.name, containers.result);

        if (participant && participant.id !== null)
            this.setupMouseHover(participant.id, containers.participant);

        return containers.participant;
    }

    /**
     * Renders a participant.
     *
     * @param containers Containers for the participant.
     * @param participant The participant result.
     * @param originHint Origin hint for the match.
     * @param matchLocation Location of the match.
     * @param roundNumber Number of the round.
     */
    private renderParticipant(containers: ParticipantContainers, participant: ParticipantResult, originHint: OriginHint, matchLocation?: BracketType, roundNumber?: number): void {
        const found = this.participants.find(item => item.id === participant.id);

        if (found) {
            containers.name.innerText = found.name;
            this.renderTeamOrigin(containers.name, participant, matchLocation, roundNumber);
        } else
            this.renderHint(containers.name, participant, originHint, matchLocation);

        containers.result.innerText = `${participant.score || '-'}`;

        dom.setupWin(containers.participant, containers.result, participant);
        dom.setupLoss(containers.participant, containers.result, participant);
    }

    /**
     * Renders an origin hint for a participant.
     *
     * @param nameContainer The name container.
     * @param participant The participant result.
     * @param originHint Origin hint for the participant.
     * @param matchLocation Location of the match.
     */
    private renderHint(nameContainer: HTMLElement, participant: ParticipantResult, originHint: OriginHint, matchLocation?: BracketType): void {
        if (originHint === undefined || participant.position === undefined) return;
        if (!this.config.showSlotsOrigin) return;
        if (!this.config.showLowerBracketSlotsOrigin && matchLocation === 'loser-bracket') return;

        dom.setupHint(nameContainer, originHint(participant.position));
    }

    /**
     * Renders a participant's origin.
     *
     * @param nameContainer The name container.
     * @param participant The participant result.
     * @param matchLocation Location of the match.
     * @param roundNumber Number of the round.
     */
    private renderTeamOrigin(nameContainer: HTMLElement, participant: ParticipantResult, matchLocation?: BracketType, roundNumber?: number): void {
        if (participant.position === undefined || matchLocation === undefined) return;
        if (this.config.participantOriginPlacement === 'none') return;
        if (!this.config.showSlotsOrigin) return;
        if (!this.config.showLowerBracketSlotsOrigin && matchLocation === 'loser-bracket') return;

        const abbreviation = getOriginAbbreviation(matchLocation, this.skipFirstRound, roundNumber);
        const origin = abbreviation + participant.position;
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