// Define the initial board state
const initialBoard = [
    ['bR', 'bN', 'bB', 'bQ', 'bK', 'bB', 'bN', 'bR'], // Rank 8
    ['bP', 'bP', 'bP', 'bP', 'bP', 'bP', 'bP', 'bP'], // Rank 7
    ['', '', '', '', '', '', '', ''],                 // Rank 6
    ['', '', '', '', '', '', '', ''],                 // Rank 5
    ['', '', '', '', '', '', '', ''],                 // Rank 4
    ['', '', '', '', '', '', '', ''],                 // Rank 3
    ['wP', 'wP', 'wP', 'wP', 'wP', 'wP', 'wP', 'wP'], // Rank 2
    ['wR', 'wN', 'wB', 'wQ', 'wK', 'wB', 'wN', 'wR']  // Rank 1
];

// Keep track of the current player's turn
let currentPlayer = 'w'; // 'w' for white, 'b' for black

// Keep track of the selected piece
let selectedPiece = null;

// Keep track of whether the kings and rooks have moved (for castling)
const hasMoved = {
    wK: false,
    wR0: false, // Queenside rook (a1)
    wR7: false, // Kingside rook (h1)
    bK: false,
    bR0: false, // Queenside rook (a8)
    bR7: false  // Kingside rook (h8)
};

// Keep track of the last move (for en passant)
let lastMove = null;

// Add gameEnded variable
let gameEnded = false;

// Initialize the chessboard
function createChessboard() {
    const board = document.getElementById('chessboard');
    const rows = 8;
    const cols = 8;

    // Loop through each square
    for (let row = 0; row < rows; row++) {
        for (let col = 0; col < cols; col++) {
            const square = document.createElement('div');
            square.classList.add('square');

            // Assign square IDs (e.g., 'a1', 'b2', etc.)
            const file = String.fromCharCode(97 + col); // 'a' to 'h'
            const rank = 8 - row; // '8' to '1'
            square.id = `${file}${rank}`;

            // Alternate colors
            if ((row + col) % 2 === 0) {
                square.classList.add('white');
            } else {
                square.classList.add('black');
            }

            // Get the piece from the initial board state
            const piece = initialBoard[row][col];
            if (piece) {
                const pieceImage = document.createElement('img');
                pieceImage.src = `images/${getPieceImageFilename(piece)}`;
                pieceImage.alt = piece;
                pieceImage.classList.add('piece');
                pieceImage.draggable = true; // Enable dragging
                pieceImage.addEventListener('dragstart', dragStart);
                pieceImage.addEventListener('click', pieceClick);
                square.appendChild(pieceImage);
            }

            // Add event listeners for drag-and-drop
            square.addEventListener('dragover', dragOver);
            square.addEventListener('drop', drop);
            square.addEventListener('dragleave', dragLeave);

            board.appendChild(square);
        }
    }

    // Update the turn display initially
    updateTurnDisplay();
}

// Helper function to get the image filename based on the piece notation
function getPieceImageFilename(piece) {
    const color = piece.charAt(0) === 'w' ? 'white' : 'black';
    const type = piece.charAt(1).toLowerCase();

    let pieceName = '';
    switch (type) {
        case 'p':
            pieceName = 'pawn';
            break;
        case 'r':
            pieceName = 'rook';
            break;
        case 'n':
            pieceName = 'knight';
            break;
        case 'b':
            pieceName = 'bishop';
            break;
        case 'q':
            pieceName = 'queen';
            break;
        case 'k':
            pieceName = 'king';
            break;
        default:
            pieceName = '';
    }
    return `icons-${color}-${pieceName}.png`;
}

// Drag-and-Drop Event Handlers

function dragStart(event) {
    if (gameEnded) {
        event.preventDefault();
        return;
    }
    event.dataTransfer.setData('text/plain', event.target.parentNode.id);
    event.dataTransfer.effectAllowed = 'move';
}

function dragOver(event) {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
    event.currentTarget.classList.add('highlight'); // Visual feedback
}

function drop(event) {
    if (gameEnded) return;
    event.preventDefault();
    const fromSquareId = event.dataTransfer.getData('text/plain');
    const toSquareId = event.currentTarget.id;

    const fromSquare = document.getElementById(fromSquareId);
    const pieceElement = fromSquare.querySelector('.piece');

    if (pieceElement) {
        const piece = pieceElement.alt; // Piece notation, e.g., 'wP', 'bK'
        const pieceColor = piece.charAt(0);

        // Enforce turn order
        if (pieceColor !== currentPlayer) {
            alert("It's not your turn!");
            return;
        }

        // Validate the move
        if (!isValidMove(piece, fromSquareId, toSquareId)) {
            alert('Invalid move!');
            return;
        }

        // Move the piece in the DOM
        event.currentTarget.innerHTML = '';
        event.currentTarget.appendChild(pieceElement);

        // Update the game state
        updateGameState(fromSquareId, toSquareId);

        // Switch the turn
        currentPlayer = currentPlayer === 'w' ? 'b' : 'w';
        updateTurnDisplay();

        // Check for checkmate
        if (isCheckmate(currentPlayer)) {
            const winner = currentPlayer === 'w' ? 'Black' : 'White';
            alert(`Checkmate! ${winner} wins.`);
            gameEnded = true;
            disableGame();
            return;
        } else if (isInCheck(currentPlayer)) {
            alert(`${currentPlayer === 'w' ? 'White' : 'Black'} is in check.`);
        }
    }

    event.currentTarget.classList.remove('highlight');
}

function dragLeave(event) {
    event.currentTarget.classList.remove('highlight');
}

// Piece Click Handler

function pieceClick(event) {
    if (gameEnded) return;
    const pieceElement = event.target;
    const piece = pieceElement.alt;
    const pieceColor = piece.charAt(0);

    // Ensure it's the current player's piece
    if (pieceColor !== currentPlayer) {
        return;
    }

    // Deselect if the same piece is clicked again
    if (selectedPiece === pieceElement) {
        clearHighlights();
        selectedPiece = null;
        return;
    }

    // Clear any previous highlights
    clearHighlights();

    // Set the selected piece
    selectedPiece = pieceElement;

    // Highlight valid moves
    highlightValidMoves(pieceElement);
}

// Highlight Valid Moves

function highlightValidMoves(pieceElement) {
    const fromSquareId = pieceElement.parentNode.id;
    const piece = pieceElement.alt;

    const squares = document.querySelectorAll('.square');

    squares.forEach(square => {
        const toSquareId = square.id;

        // Skip if the from and to squares are the same
        if (fromSquareId === toSquareId) return;

        // Use isValidMove to check if the move is valid
        if (isValidMove(piece, fromSquareId, toSquareId)) {
            square.classList.add('valid-move');
            square.addEventListener('click', movePiece);
        }
    });
}

// Move Piece on Click

function movePiece(event) {
    if (gameEnded) return;
    const toSquare = event.currentTarget;
    const toSquareId = toSquare.id;
    const fromSquareId = selectedPiece.parentNode.id;

    const piece = selectedPiece.alt;

    // Validate again before moving
    if (!isValidMove(piece, fromSquareId, toSquareId)) {
        alert('Invalid move!');
        clearHighlights();
        selectedPiece = null;
        return;
    }

    // Move the piece in the DOM
    toSquare.innerHTML = '';
    toSquare.appendChild(selectedPiece);

    // Update the game state
    updateGameState(fromSquareId, toSquareId);

    // Switch the turn
    currentPlayer = currentPlayer === 'w' ? 'b' : 'w';
    updateTurnDisplay();

    // Clear highlights and reset selected piece
    clearHighlights();
    selectedPiece = null;

    // Check for checkmate
    if (isCheckmate(currentPlayer)) {
        const winner = currentPlayer === 'w' ? 'Black' : 'White';
        alert(`Checkmate! ${winner} wins.`);
        gameEnded = true;
        disableGame();
        return;
    } else if (isInCheck(currentPlayer)) {
        alert(`${currentPlayer === 'w' ? 'White' : 'Black'} is in check.`);
    }
}

// Clear Highlights

function clearHighlights() {
    const squares = document.querySelectorAll('.square');
    squares.forEach(square => {
        square.classList.remove('valid-move');
        square.removeEventListener('click', movePiece);
    });
}

// Update Turn Display

function updateTurnDisplay() {
    const turnIndicator = document.getElementById('turn-indicator');
    const playerColor = currentPlayer === 'w' ? 'White' : 'Black';
    turnIndicator.textContent = `${playerColor}'s Turn`;
}

// Update Game State Function

function updateGameState(fromSquareId, toSquareId) {
    const fromCoords = squareIdToCoords(fromSquareId);
    const toCoords = squareIdToCoords(toSquareId);

    const piece = initialBoard[fromCoords.row][fromCoords.col];
    initialBoard[fromCoords.row][fromCoords.col] = '';
    initialBoard[toCoords.row][toCoords.col] = piece;

    // Update hasMoved status for kings and rooks (for castling)
    if (piece === 'wK') hasMoved.wK = true;
    if (piece === 'bK') hasMoved.bK = true;

    if (piece === 'wR' && fromCoords.row === 7 && fromCoords.col === 0) hasMoved.wR0 = true;
    if (piece === 'wR' && fromCoords.row === 7 && fromCoords.col === 7) hasMoved.wR7 = true;

    if (piece === 'bR' && fromCoords.row === 0 && fromCoords.col === 0) hasMoved.bR0 = true;
    if (piece === 'bR' && fromCoords.row === 0 && fromCoords.col === 7) hasMoved.bR7 = true;

    // Handle castling move
    if (piece.charAt(1) === 'K' && Math.abs(fromCoords.col - toCoords.col) === 2) {
        performCastling(piece, fromCoords, toCoords);
    }

    // Handle en passant capture
    if (piece.charAt(1) === 'P') {
        handleEnPassantCapture(piece, fromCoords, toCoords);
    }

    // Check for pawn promotion
    if (piece.charAt(1) === 'P') {
        const promotionRow = piece.charAt(0) === 'w' ? 0 : 7;
        if (toCoords.row === promotionRow) {
            promotePawn(toCoords.row, toCoords.col, piece.charAt(0));
        }
    }

    // Update lastMove
    lastMove = {
        piece: piece,
        from: fromSquareId,
        to: toSquareId
    };
}

// Helper Function to Convert Square IDs to Array Indices

function squareIdToCoords(squareId) {
    const file = squareId.charCodeAt(0) - 97; // 'a' to 'h' => 0 to 7
    const rank = 8 - parseInt(squareId.charAt(1)); // '8' to '1' => 0 to 7
    return { row: rank, col: file };
}

// Helper Function to Convert Array Indices to Square IDs

function coordsToSquareId(row, col) {
    const file = String.fromCharCode(97 + col); // 'a' to 'h'
    const rank = 8 - row; // '8' to '1'
    return `${file}${rank}`;
}

// Move Validation Function

function isValidMove(piece, fromSquareId, toSquareId, skipCheckTest = false) {
    const pieceType = piece.charAt(1);
    const pieceColor = piece.charAt(0);

    const fromCoords = squareIdToCoords(fromSquareId);
    const toCoords = squareIdToCoords(toSquareId);

    const targetPiece = initialBoard[toCoords.row][toCoords.col];

    // Prevent capturing own pieces
    if (targetPiece !== '' && targetPiece.charAt(0) === pieceColor) {
        return false;
    }

    // Implement move validation for each piece type
    let isMoveValid = false;

    switch (pieceType) {
        case 'P':
            isMoveValid = validatePawnMove(pieceColor, fromCoords, toCoords, targetPiece);
            break;
        case 'N':
            isMoveValid = validateKnightMove(fromCoords, toCoords);
            break;
        case 'B':
            isMoveValid = validateBishopMove(fromCoords, toCoords);
            break;
        case 'R':
            isMoveValid = validateRookMove(fromCoords, toCoords);
            break;
        case 'Q':
            isMoveValid = validateQueenMove(fromCoords, toCoords);
            break;
        case 'K':
            isMoveValid = validateKingMove(fromCoords, toCoords, pieceColor);
            break;
        default:
            isMoveValid = false; // Invalid piece type
    }

    if (!isMoveValid) {
        return false;
    }

    // Skip the check test if specified
    if (skipCheckTest) {
        return true;
    }

    // Simulate the move
    const originalFromPiece = initialBoard[fromCoords.row][fromCoords.col];
    const originalToPiece = initialBoard[toCoords.row][toCoords.col];

    // Make the move on the board
    initialBoard[toCoords.row][toCoords.col] = piece;
    initialBoard[fromCoords.row][fromCoords.col] = '';

    // Check if own king is in check
    const inCheck = isInCheck(pieceColor);

    // Revert the move
    initialBoard[fromCoords.row][fromCoords.col] = originalFromPiece;
    initialBoard[toCoords.row][toCoords.col] = originalToPiece;

    return !inCheck;
}

// Validation Functions for Each Piece

function validatePawnMove(pieceColor, fromCoords, toCoords, targetPiece) {
    const direction = pieceColor === 'w' ? -1 : 1;
    const startRow = pieceColor === 'w' ? 6 : 1;

    // Moving forward
    if (fromCoords.col === toCoords.col) {
        // Move one square forward
        if (fromCoords.row + direction === toCoords.row && targetPiece === '') {
            return true;
        }
        // Move two squares forward from starting position
        if (
            fromCoords.row === startRow &&
            fromCoords.row + 2 * direction === toCoords.row &&
            targetPiece === '' &&
            initialBoard[fromCoords.row + direction][fromCoords.col] === ''
        ) {
            return true;
        }
    }
    // Capturing diagonally
    if (Math.abs(fromCoords.col - toCoords.col) === 1) {
        // Standard capture
        if (fromCoords.row + direction === toCoords.row && targetPiece !== '' && targetPiece.charAt(0) !== pieceColor) {
            return true;
        }
        // En passant capture
        if (fromCoords.row + direction === toCoords.row && targetPiece === '') {
            return validateEnPassant(pieceColor, fromCoords, toCoords);
        }
    }
    // Invalid pawn move
    return false;
}

function validateKnightMove(fromCoords, toCoords) {
    const rowDiff = Math.abs(fromCoords.row - toCoords.row);
    const colDiff = Math.abs(fromCoords.col - toCoords.col);

    if (
        (rowDiff === 2 && colDiff === 1) ||
        (rowDiff === 1 && colDiff === 2)
    ) {
        // Valid knight move
        return true;
    }
    return false;
}

function validateBishopMove(fromCoords, toCoords) {
    const rowDiff = Math.abs(fromCoords.row - toCoords.row);
    const colDiff = Math.abs(fromCoords.col - toCoords.col);

    if (rowDiff === colDiff) {
        if (isPathClear(fromCoords, toCoords)) {
            return true;
        }
    }
    return false;
}

function validateRookMove(fromCoords, toCoords) {
    if (
        fromCoords.row === toCoords.row ||
        fromCoords.col === toCoords.col
    ) {
        if (isPathClear(fromCoords, toCoords)) {
            return true;
        }
    }
    return false;
}

function validateQueenMove(fromCoords, toCoords) {
    const rowDiff = Math.abs(fromCoords.row - toCoords.row);
    const colDiff = Math.abs(fromCoords.col - toCoords.col);

    if (
        fromCoords.row === toCoords.row || // Horizontal
        fromCoords.col === toCoords.col || // Vertical
        rowDiff === colDiff                // Diagonal
    ) {
        if (isPathClear(fromCoords, toCoords)) {
            return true;
        }
    }
    return false;
}

function validateKingMove(fromCoords, toCoords, pieceColor) {
    const rowDiff = Math.abs(fromCoords.row - toCoords.row);
    const colDiff = Math.abs(fromCoords.col - toCoords.col);

    // Standard king move
    if (rowDiff <= 1 && colDiff <= 1) {
        return true;
    }

    // Castling move
    if (rowDiff === 0 && colDiff === 2) {
        return validateCastling(fromCoords, toCoords, pieceColor);
    }

    return false;
}

// Validate Castling

function validateCastling(fromCoords, toCoords, pieceColor) {
    const row = fromCoords.row;
    const direction = toCoords.col - fromCoords.col; // +2 for kingside, -2 for queenside

    // Check if king has moved
    if ((pieceColor === 'w' && hasMoved.wK) || (pieceColor === 'b' && hasMoved.bK)) {
        return false;
    }

    // Kingside castling
    if (direction === 2) {
        if ((pieceColor === 'w' && hasMoved.wR7) || (pieceColor === 'b' && hasMoved.bR7)) {
            return false;
        }
        // Check if squares between king and rook are empty
        if (initialBoard[row][fromCoords.col + 1] !== '' || initialBoard[row][fromCoords.col + 2] !== '') {
            return false;
        }
        // Check if squares are under attack
        if (isSquareAttacked(row, fromCoords.col, pieceColor) || isSquareAttacked(row, fromCoords.col + 1, pieceColor) || isSquareAttacked(row, fromCoords.col + 2, pieceColor)) {
            return false;
        }
        return true;
    }

    // Queenside castling
    if (direction === -2) {
        if ((pieceColor === 'w' && hasMoved.wR0) || (pieceColor === 'b' && hasMoved.bR0)) {
            return false;
        }
        // Check if squares between king and rook are empty
        if (initialBoard[row][fromCoords.col - 1] !== '' || initialBoard[row][fromCoords.col - 2] !== '' || initialBoard[row][fromCoords.col - 3] !== '') {
            return false;
        }
        // Check if squares are under attack
        if (isSquareAttacked(row, fromCoords.col, pieceColor) || isSquareAttacked(row, fromCoords.col - 1, pieceColor) || isSquareAttacked(row, fromCoords.col - 2, pieceColor)) {
            return false;
        }
        return true;
    }

    return false;
}

// Perform Castling

function performCastling(piece, fromCoords, toCoords) {
    const row = fromCoords.row;
    if (toCoords.col === 6) { // Kingside castling
        // Move the rook from h1/h8 to f1/f8
        const rookFromCol = 7;
        const rookToCol = 5;
        movePieceOnBoard(row, rookFromCol, row, rookToCol);
        movePieceInDOM(row, rookFromCol, row, rookToCol);
    } else if (toCoords.col === 2) { // Queenside castling
        // Move the rook from a1/a8 to d1/d8
        const rookFromCol = 0;
        const rookToCol = 3;
        movePieceOnBoard(row, rookFromCol, row, rookToCol);
        movePieceInDOM(row, rookFromCol, row, rookToCol);
    }
}

// Helper Functions for Moving Pieces on Board and DOM

function movePieceOnBoard(fromRow, fromCol, toRow, toCol) {
    const piece = initialBoard[fromRow][fromCol];
    initialBoard[fromRow][fromCol] = '';
    initialBoard[toRow][toCol] = piece;
}

function movePieceInDOM(fromRow, fromCol, toRow, toCol) {
    const fromSquareId = coordsToSquareId(fromRow, fromCol);
    const toSquareId = coordsToSquareId(toRow, toCol);

    const fromSquare = document.getElementById(fromSquareId);
    const toSquare = document.getElementById(toSquareId);

    const pieceElement = fromSquare.querySelector('.piece');
    if (pieceElement) {
        fromSquare.removeChild(pieceElement);
        toSquare.appendChild(pieceElement);
    }
}

// Validate En Passant

function validateEnPassant(pieceColor, fromCoords, toCoords) {
    if (!lastMove) return false;

    const opponentColor = pieceColor === 'w' ? 'b' : 'w';
    const pawnRow = pieceColor === 'w' ? 3 : 4;

    // Ensure the pawn is on the correct rank
    if (fromCoords.row !== pawnRow) return false;

    // The last move must be the opponent's pawn moving two squares forward
    const lastMoveFromCoords = squareIdToCoords(lastMove.from);
    const lastMoveToCoords = squareIdToCoords(lastMove.to);

    if (
        lastMove.piece === opponentColor + 'P' &&
        Math.abs(lastMoveFromCoords.row - lastMoveToCoords.row) === 2 &&
        lastMoveToCoords.row === fromCoords.row &&
        lastMoveToCoords.col === toCoords.col
    ) {
        return true;
    }

    return false;
}

// Handle En Passant Capture

function handleEnPassantCapture(piece, fromCoords, toCoords) {
    if (fromCoords.col !== toCoords.col && initialBoard[toCoords.row][toCoords.col] === '') {
        // En passant capture occurred
        const direction = piece.charAt(0) === 'w' ? 1 : -1;
        const capturedPawnRow = toCoords.row + direction;
        const capturedPawnCol = toCoords.col;
        initialBoard[capturedPawnRow][capturedPawnCol] = '';

        // Remove the captured pawn from the DOM
        const capturedSquareId = coordsToSquareId(capturedPawnRow, capturedPawnCol);
        const capturedSquare = document.getElementById(capturedSquareId);
        capturedSquare.innerHTML = '';
    }
}

// Promote Pawn

function promotePawn(row, col, pieceColor) {
    // Show the promotion modal
    const modal = document.getElementById('promotion-modal');
    modal.style.display = 'block';

    // Get the promotion options container
    const promotionOptions = document.querySelector('.promotion-options');

    // Remove any existing color-specific classes
    promotionOptions.classList.remove('white-promotion-piece', 'black-promotion-piece');

    // Add the appropriate class based on the piece color
    if (pieceColor === 'w') {
        promotionOptions.classList.add('white-promotion-piece');
    } else {
        promotionOptions.classList.add('black-promotion-piece');
    }

    // Get all promotion option images
    const options = document.querySelectorAll('.promotion-option img');

    // Set correct piece images based on the color
    options.forEach(option => {
        const pieceType = option.getAttribute('data-piece');
        option.src = `images/${getPieceImageFilename(pieceColor + pieceType)}`;
    });

    // Function to handle the choice
    function handlePromotionChoice(event) {
        const choice = event.target.getAttribute('data-piece');
        const newPiece = pieceColor + choice;
        initialBoard[row][col] = newPiece;

        // Update the piece in the DOM
        const squareId = coordsToSquareId(row, col);
        const square = document.getElementById(squareId);
        square.innerHTML = ''; // Remove the pawn image

        const pieceImage = document.createElement('img');
        pieceImage.src = `images/${getPieceImageFilename(newPiece)}`;
        pieceImage.alt = newPiece;
        pieceImage.classList.add('piece');
        pieceImage.draggable = true;
        pieceImage.addEventListener('dragstart', dragStart);
        pieceImage.addEventListener('click', pieceClick);

        square.appendChild(pieceImage);

        // Close the modal and remove event listeners
        modal.style.display = 'none';
        options.forEach(option => {
            option.removeEventListener('click', handlePromotionChoice);
        });
    }

    // Add event listeners to the options
    options.forEach(option => {
        option.addEventListener('click', handlePromotionChoice);
    });
}

// Helper function to check if path is clear (for bishop, rook, and queen)

function isPathClear(fromCoords, toCoords) {
    const rowDirection = toCoords.row - fromCoords.row;
    const colDirection = toCoords.col - fromCoords.col;

    const rowStep = rowDirection === 0 ? 0 : rowDirection / Math.abs(rowDirection);
    const colStep = colDirection === 0 ? 0 : colDirection / Math.abs(colDirection);

    let currentRow = fromCoords.row + rowStep;
    let currentCol = fromCoords.col + colStep;

    while (currentRow !== toCoords.row || currentCol !== toCoords.col) {
        if (initialBoard[currentRow][currentCol] !== '') {
            return false; // Path is blocked
        }
        currentRow += rowStep;
        currentCol += colStep;
    }
    return true; // Path is clear
}

// Find King's Position
function findKingPosition(color) {
    for (let row = 0; row < 8; row++) {
        for (let col = 0; col < 8; col++) {
            if (initialBoard[row][col] === color + 'K') {
                return { row: row, col: col };
            }
        }
    }
    return null; // King not found (should not happen)
}

// Check if King is in Check
function isInCheck(color) {
    const opponentColor = color === 'w' ? 'b' : 'w';
    const kingPosition = findKingPosition(color);

    // Loop through all opponent pieces
    for (let row = 0; row < 8; row++) {
        for (let col = 0; col < 8; col++) {
            const piece = initialBoard[row][col];
            if (piece && piece.charAt(0) === opponentColor) {
                const fromSquareId = coordsToSquareId(row, col);
                const toSquareId = coordsToSquareId(kingPosition.row, kingPosition.col);

                // Check if the opponent's piece can move to the king's position
                if (isValidMove(piece, fromSquareId, toSquareId, true)) {
                    return true; // King is in check
                }
            }
        }
    }
    return false; // King is not in check
}

// Check if Square is Attacked (used for castling validation)
function isSquareAttacked(row, col, color) {
    const opponentColor = color === 'w' ? 'b' : 'w';
    const squareId = coordsToSquareId(row, col);

    // Loop through all opponent pieces
    for (let r = 0; r < 8; r++) {
        for (let c = 0; c < 8; c++) {
            const piece = initialBoard[r][c];
            if (piece && piece.charAt(0) === opponentColor) {
                const fromSquareId = coordsToSquareId(r, c);

                if (isValidMove(piece, fromSquareId, squareId, true)) {
                    return true; // Square is attacked
                }
            }
        }
    }
    return false; // Square is not attacked
}

// Function to display the checkmate popup
function showCheckmatePopup(winner) {
    const checkmateModal = document.createElement('div');
    checkmateModal.id = 'checkmate-modal'; // Unique ID for the checkmate modal
    checkmateModal.classList.add('modal'); // Add modal class for styling

    const modalContent = document.createElement('div');
    modalContent.classList.add('checkmate-modal-content'); // Use a unique class name to avoid conflicts

    const message = document.createElement('p');
    message.textContent = `Checkmate! ${winner} has won. The game is over.`;

    const closeButton = document.createElement('button');
    closeButton.textContent = 'Close';
    closeButton.onclick = function () {
        checkmateModal.style.display = 'none';
    };

    modalContent.appendChild(message);
    modalContent.appendChild(closeButton);
    checkmateModal.appendChild(modalContent);
    document.body.appendChild(checkmateModal);

    // Display the modal
    checkmateModal.style.display = 'block';
}

// Call this function when checkmate is detected
function isCheckmate(color) {
    if (!isInCheck(color)) {
        return false; // Not in check, so cannot be checkmate
    }

    // Check if there are any legal moves for the current player
    for (let row = 0; row < 8; row++) {
        for (let col = 0; col < 8; col++) {
            const piece = initialBoard[row][col];
            if (piece && piece.charAt(0) === color) {
                const fromSquareId = coordsToSquareId(row, col);

                for (let toRow = 0; toRow < 8; toRow++) {
                    for (let toCol = 0; toCol < 8; toCol++) {
                        const toSquareId = coordsToSquareId(toRow, toCol);

                        if (isValidMove(piece, fromSquareId, toSquareId)) {
                            const originalFromPiece = initialBoard[row][col];
                            const originalToPiece = initialBoard[toRow][toCol];

                            initialBoard[toRow][toCol] = piece;
                            initialBoard[row][col] = '';

                            const stillInCheck = isInCheck(color);

                            initialBoard[row][col] = originalFromPiece;
                            initialBoard[toRow][toCol] = originalToPiece;

                            if (!stillInCheck) {
                                return false; // There's a move that avoids checkmate
                            }
                        }
                    }
                }
            }
        }
    }

    // No valid moves, it's checkmate
    const winner = color === 'w' ? 'Black' : 'White';
    showCheckmatePopup(winner);

    return true;
}


createChessboard();

