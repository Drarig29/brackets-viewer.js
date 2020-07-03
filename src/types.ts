import { Participant, Group, Round, Match, MatchGame } from "brackets-model";

export interface Connection {
    connectPrevious: boolean,
    connectNext: boolean,
}

export interface TournamentData {
    group: Group[],
    round: Round[],
    match: Match[],
    match_game: MatchGame[],
    participant: Participant[],
}