import React, { useContext, useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Chessboard } from 'react-chessboard';
import CountdownTimer from './Countdown';
import ChatBox from './Chatbox';
import Username from './Username';
import Sidebar from './Sidebar';
import { Chess } from 'chess.js';
import CustomizedSnackbars from '../Snackbar/Snackbar';
import ResultDialog from './ResultDialog';
import { useSocket } from '../../providers/socketContext';
import { GameDataContext } from '../../providers/gameDataProvider';
import { UserDetailsContext } from '../Authentication/AuthRoute';
import ConfirmationDialog from './ConfirmationDialog'; // Import a new ConfirmationDialog component

function Gameboard() {
  const socket = useSocket();
  const { roomId } = useParams();
  const { gameData } = useContext(GameDataContext);
  const { userDetails } = useContext(UserDetailsContext);
  const [game, setGame] = useState(new Chess());
  const [time, setTime] = useState({ w: 0, b: 0, pw: true, pb: true });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState({ show: false, message: '', type: '' });
  const [gameOver, setGameOver] = useState(false);
  const [resultMessage, setResultMessage] = useState('');
  const [promotion, setPromotion] = useState({ show: false, ssquare: null, tsquare: null });
  const [drawRequest, setDrawRequest] = useState({ show: false, userId: null }); // State to handle draw request

  const navigate = useNavigate();

  useEffect(() => {
    if (gameData) {
      const newGame = new Chess(gameData.fen);
      const timeDifference = (new Date().getTime() - gameData.serverTime) / 1000;
      setGame(newGame);
      if (newGame.turn() === 'w') {
        setTime({ w: gameData.timew - timeDifference, b: gameData.timeb, pw: gameData.firstMovew, pb: gameData.firstMoveb });
      } else {
        setTime({ w: gameData.timew, b: gameData.timeb - timeDifference, pw: gameData.firstMovew, pb: gameData.firstMoveb });
      }
      setIsLoading(false);
      if (gameData.over) {
        setGameOver(true);
        setResultMessage(gameData.resultMessage || 'Game Over');
      }
    }
  }, [gameData]);

  const onDrop = (sourceSquare, targetSquare, p, promotionPiece = 'q') => {
    if (gameOver) return false; // Prevent moves if the game is over

    try {
      const piece = game.get(sourceSquare);
      if (game.turn() !== gameData.color[0]) {
        setError({ show: true, message: 'Not your turn', type: 'error' });
        return false;
      }

      if (promotion.show) {
        setPromotion({ show: false, ssquare: null, tsquare: null });
      } else if (piece?.type === 'p' && ((piece.color === 'w' && targetSquare[1] === '8') || (piece.color === 'b' && targetSquare[1] === '1'))) {
        setPromotion({ show: true, ssquare: sourceSquare, tsquare: targetSquare });
        return false;
      }

      let move = game.move({
        from: sourceSquare,
        to: targetSquare,
        promotion: promotionPiece,
      });

      if (move === null) return false;
      socket.emit('move', { roomId, userId: userDetails._id, move: game.fen(), color: gameData.color });
      setGame(new Chess(game.fen()));
      if (game.isGameOver()) {
        setGameOver(true);
        setResultMessage('Game Over');
      }
    } catch (error) {
      setError({ show: true, message: error.message, type: 'error' });
    }
  };

  const handlePromotion = (piece) => {
    onDrop(promotion.ssquare, promotion.tsquare, 'p', piece);
  };

  const handleOpponentMove = ({ move, timew, timeb, serverTime, firstMovew, firstMoveb }) => {
    const newGame = new Chess(move);
    const timeDifference = (new Date().getTime() - serverTime) / 1000;
    if (newGame.turn() === 'w') {
      setTime({ w: timew - timeDifference, b: timeb });
    } else {
      setTime({ w: timew, b: timeb - timeDifference });
    }

    setGame(newGame);
    if (newGame.isCheckmate()) {
      setGameOver(true);
      setResultMessage('Checkmate! You Win');
    }
  };

  useEffect(() => {
    socket.on('move', (data) => {
      handleOpponentMove(data);
    });

    socket.on('opponentResigned', () => {
      setGameOver(true);
      setResultMessage('Opponent Resigned. You won.');
    });

    socket.on('drawRequest', ({ userId }) => {
      setDrawRequest({ show: true, userId });
    });

    socket.on('drawOccurred', () => {
      setGameOver(true);
      setResultMessage('The game is a draw.');
    });

    socket.on('drawRejected', () => {
      setError({ show: true, message: 'Your draw request was rejected', type: 'info' });
    });

    return () => {
      socket.off('move');
      socket.off('opponentResigned');
      socket.off('drawRequest');
      socket.off('drawOccurred');
      socket.off('drawRejected');
    };
  }, [socket]);

  useEffect(() => {
    socket.emit('joinRoom', { roomId });
  }, [socket, roomId]);

  const handleDraw = () => {
    socket.emit('draw', { roomId, userId: userDetails._id });
  };

  const handleConfirmDraw = (accept) => {
    socket.emit('confirmDraw', { roomId, userId: drawRequest.userId, accept });
    setDrawRequest({ show: false, userId: null });
    if (accept) {
      setGameOver(true);
      setResultMessage('The game is a draw.');
    }
  };

  const handleResign = () => {
    console.log('Resign button clicked'); // Debugging log
    setGameOver(true);
    socket.emit('resign', { roomId });
    setResultMessage('You have resigned. Your opponent wins.');
  };

  if (isLoading) return <div>Loading...</div>;

  return (
    <>
      <div className='flex flex-row items-center justify-center bg-background h-auto w-full '>
        <div className=' w-fit flex items-center justify-start h-full'>
          <Sidebar />
        </div>
        <div className='flex flex-col items-end justify-between h-full w-fit py-16'>
          <Username username={gameData.opponent.username} rating={gameData.opponent.rating} profilePic={gameData.opponent.profilePicture} />
          <Username username={userDetails.username} rating={userDetails.rating} profilePic={userDetails.profilePicture} />
        </div>
        <div className='flex flex-col items-center justify-center w-1/2 p-5 relative'>
          {promotion.show && (
            <div className='absolute top-0 left-0 w-full h-full flex items-center justify-center' style={{ zIndex: 2 }}>
              <div className='grid grid-row-4 border-4 border-border'>
                <div onClick={() => handlePromotion('q')} className='bg-[#fef8e2] w-20'>
                  <img src='/images/chess/qw.png' alt='Queen' />
                </div>
                <div onClick={() => handlePromotion('r')} className='bg-[#055205] w-20'>
                  <img src='/images/chess/rw.png' alt='Rook' />
                </div>
                <div onClick={() => handlePromotion('b')} className='bg-[#fef8e2] w-20'>
                  <img src='/images/chess/bw.png' alt='Bishop' />
                </div>
                <div onClick={() => handlePromotion('n')} className='bg-[#055205] w-20'>
                  <img src='/images/chess/nw.png' alt='Knight' />
                </div>
              </div>
            </div>
          )}
          <div className={promotion.show ? 'w-full h-full opacity-40' : 'w-full h-full'}>
            <Chessboard
              boardOrientation={gameData.color}
              position={game.fen()}
              customDarkSquareStyle={{ backgroundColor: '#08825e' }}
              autoPromoteToQueen={true}
              onPieceDrop={onDrop}
            />
          </div>
        </div>
        <div className='flex flex-col justify-between w-1/4 h-full py-20'>
          <div className='flex flex-col items-start justify-start'>
            <CountdownTimer initialCount={gameData.color !== 'white' ? time.w : time.b} pause={game.turn() === gameData.color[0]} />
          </div>
          <div className='flex flex-row items-center justify-evenly w-full gap-2'>
            <button type='submit' className='bg-primary-light rounded-sm w-2/6 px-3 py-3 mt-6 font-semibold text-copy text-md' onClick={handleDraw}>
              <span className='flex flex-row items-center justify-center gap-2'>
                Draw
              </span>
            </button>
            <button type='submit' className='bg-primary-light rounded-sm w-2/6 px-3 py-3 mt-6 font-semibold text-copy text-md' onClick={handleResign}>
              <span className='flex flex-row items-center justify-center gap-2'>
                Resign
              </span>
            </button>
          </div>
          <div className='flex m-3 p-2'>
            <ChatBox socket={socket}/>
          </div>
          <div className='flex flex-col items-start justify-start'>
            <CountdownTimer initialCount={gameData.color === 'white' ? time.w : time.b} pause={game.turn() !== gameData.color[0]} />
          </div>
        </div>
      </div>
      {error.show && (
        <CustomizedSnackbars
          open={error.show}
          type={error.type}
          message={error.message}
          handleClose={(event, reason) => {
            if (reason === 'clickaway') {
              return;
            }
            setError({ open: false, type: '', message: '' });
          }}
        />
      )}
      <ResultDialog
        open={gameOver}
        resultMessage={resultMessage}
        handleClose={() => {
          setGameOver(false);
          navigate('/home');
        }}
      />
      <ConfirmationDialog
        open={drawRequest.show}
        message="Your opponent has requested a draw. Do you accept?"
        onConfirm={() => handleConfirmDraw(true)}
        onCancel={() => handleConfirmDraw(false)}
      />
    </>
  );
}

export default Gameboard;
