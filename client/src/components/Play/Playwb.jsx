import { useState } from "react";
import { Chess } from 'chess.js'
import { Chessboard } from "react-chessboard";
 function PlayRandomMoveEngine() {
    const [game, setGame] = useState(new Chess());

    function makeMove(move) {
        try {
          // Attempt to make the move
          const result = game.move(move);
          
          // If the move was successful, update the game state
          if (result !== null) {
            setGame(new Chess(game.fen()));
            return result; 
          } else {
            return null; // Return null if the move was illegal
          }
        } catch (error) {
          console.error("Error making move:", error);
          return null; // Return null if an error occurred
        }
      }
      
      
    function makeRandomMove() {
      const possibleMoves = game.moves();
      if (game.isGameOver() || game.isDraw() || possibleMoves.length === 0) return; // exit if the game is over
      const randomIndex = Math.floor(Math.random() * possibleMoves.length);
      makeMove(possibleMoves[randomIndex]);
    }
  
    function onDrop(sourceSquare, targetSquare) {
        const move = makeMove({
          from: sourceSquare,
          to: targetSquare,
          promotion: "q", // always promote to a queen for example simplicity
        });
    
        // illegal move
        if (move === null) return false;
        setTimeout(makeRandomMove,100);
        return true;
      }
  return (
    <div className="bg-background w-full h-full flex justify-center items-center">
      <div className="w-1/2 px-20 py-28">
        <div className="w-full border-2 border-copy">
          <Chessboard
            areArrowsAllowed={true}
            boardOrientation="white"
            showBoardNotation={false}
            position={game.fen()}
            onPieceDrop={onDrop}
            customDarkSquareStyle={{ backgroundColor: "#202d29" }}
          />
        </div>
      </div>
    </div>
  );
}

export default PlayRandomMoveEngine;
