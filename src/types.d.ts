type TournamentType = "pools" | "single_elimination" | "double_elimination";
type OrderingType = "natural" | "reverse" | "half_shift" | "reverse_half_shift" | "pair_flip";

type Teams = string[];

type MatchScores = [number, number];
type RoundScores = MatchScores[];
type BracketScores = RoundScores[];
type TournamentResults = BracketScores[];

interface TournamentData {
    name: string,
    type: TournamentType,
    minorOrdering: OrderingType[],
    teams: Teams,
    results: TournamentResults,
}

interface Connection {
    connectPrevious: boolean,
    connectNext: boolean,
}