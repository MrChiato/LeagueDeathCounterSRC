import styled from "styled-components";


const StyledText = styled.div`
    color: black;
    text-align: center;
    p{
        color: black;
    }
    b{
        color: red;
    }
    h2{
        color: black;
    }
` 

const STable = styled.table`
    width: 100%;
    border: 1px solid;
    border-collapse: collapse;
`

const STHead = styled.thead`
`

const STHeadTR = styled.tr`
`

const STH = styled.th`
    padding: 15px;
`

const STBody = styled.tbody`
`

const STBodyTR = styled.tr`
`

const STD = styled.td`
    padding: 5px;
    border: 1px solid;
`

const DeathTD = styled.td`
    padding: 5px;
    border: 1px solid;
    font-weight: 700;
`


export default function Leaderboard(){
    if (window.localStorage.getItem("Highscores") != null) return (
        <StyledText>
        <h2>Leaderboard</h2>
        <LeaderboardTable></LeaderboardTable>
        </StyledText>
    )
}

function LeaderboardTable(){
    let data = JSON.parse(window.localStorage.getItem("Highscores"));
    if (data !== null && data.hasOwnProperty(1)){
        const keys = Object.keys(data[0]);
        return (
            <STable>
                <STHead>
                    <STHeadTR>
                        {["#",...keys].map((item,index) => (
                            <STH key={index}>{item}</STH>
                        ))}
                    </STHeadTR>
                </STHead>
                <STBody>
                    {data.map((obj, index) => (
                        <STBodyTR key={index}>
                            <STD>{index+1}</STD>
                            {keys.map((item, index) => {
                                const value = obj[item];
                                if (index == 1) 
                                    return <DeathTD key={index}>{value}</DeathTD>
                                else
                                    return <STD key={index}>{value}</STD>
                            })}
                        </STBodyTR>
                    ))}
                </STBody>
            </STable>
        )
    }
}