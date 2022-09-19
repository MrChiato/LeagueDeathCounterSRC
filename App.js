import PageTitle from './Components/Header';
import InputBox1 from './Components/Forms';
import {Button} from './Components/Button.styled';
import {Container} from './Components/Container.styled';
import { loadButtonClicked } from './ApiFunctions';
import { updateButtonClicked } from './ApiFunctions';
import {StyledText} from './Components/InfoText.styled'
import Leaderboard from './Components/Leaderboard.styled'
import { deathLeaderboard } from './ApiFunctions';
import {updateAllUsers} from './ApiFunctions';


function App(){
  deathLeaderboard();
  return (
    <Container>
      <PageTitle/>
      <StyledText id="errorText"></StyledText>
      <InputBox1/>
      <Button id="loadButton" onClick={loadButtonClicked}>
        Load deaths
      </Button>
      <p id="loadedName"></p>
      <b id="loadedDeaths"></b>
      <p id="loadedMatches"></p>
      <p id="timeDead"></p>
      <p id="averageDeaths"></p>
      <Button id="updateAllButton" onClick={updateButtonClicked}>
        Update All
      </Button>
      <Leaderboard/>
    </Container>
  )
}
export default App;
