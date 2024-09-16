## Chess Game Code Overview
This JavaScript code powers a simple chess game implementation, featuring the core mechanics of chess, including move validation, castling, en passant, and pawn promotion. Below is a high-level overview of the key elements of the code:

## 1. Initial Board Setup
The chessboard is represented as an 8x8 array (initialBoard) where each element is a string representing a piece (e.g., 'wK' for white king, 'bP' for black pawn).
The board is rendered dynamically in HTML using createChessboard().

## 2. Turn Management
The game tracks the current player using currentPlayer, alternating between 'w' (white) and 'b' (black) after each move.
A visual turn indicator is updated via updateTurnDisplay() to inform players whose turn it is.

## 3. Drag-and-Drop Functionality
Players move pieces by dragging and dropping them onto valid target squares. Event listeners like dragstart, dragover, drop, and dragleave handle these interactions.
Move validation ensures players can only move their pieces and follow chess rules. Invalid moves trigger an alert.

## 4. Move Validation
Each type of piece (pawn, rook, knight, bishop, queen, king) has a corresponding validation function to ensure moves adhere to the rules of chess.
Castling is implemented and validated, checking if the king and rooks have moved and if the path is clear.
En passant and pawn promotion are handled, with promotions allowing players to choose the piece their pawn is promoted to when reaching the end of the board.

## 5. Game State Management
The game state is updated in updateGameState(), which moves pieces on the internal board and handles special moves like castling, en passant, and promotion.
Pawn promotion is interactive, prompting the player to select a new piece (queen, knight, rook, or bishop).

## 6. Check and Checkmate Detection
The game detects when a player’s king is in check via isInCheck(). If a player has no valid moves to escape check, it triggers a checkmate, ending the game.
The function isCheckmate() checks if a player is in checkmate, and if so, a modal is displayed to declare the winner.

## 7. Game End
When a checkmate occurs, the game is over, and players are notified with a modal popup that declares the winner.
The game cannot proceed after checkmate, preventing any further moves.