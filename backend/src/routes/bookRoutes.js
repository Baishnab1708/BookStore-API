const express = require('express');
const auth = require('../middleware/auth');
const { PrismaClient } = require('@prisma/client');

const router = express.Router();
const prisma = new PrismaClient();

// Apply auth middleware to all book routes
router.use(auth);

// Create a new book
router.post('/', async (req, res) => {
  try {
    const { title, author, category, price, rating, publishedDate } = req.body;
    
    // Validate required fields
    if (!title || !author || !category || price === undefined || rating === undefined || !publishedDate) {
      return res.status(400).json({ message: 'All fields are required' });
    }
    
    // Create book
    const book = await prisma.book.create({
      data: {
        title,
        author,
        category,
        price: parseFloat(price),
        rating: parseFloat(rating),
        publishedDate: new Date(publishedDate)
      }
    });
    
    res.status(201).json(book);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get all books with filtering, search, and pagination
router.get('/', async (req, res) => {
  try {
    const { 
      author, 
      category, 
      rating, 
      title, 
      page = 1, 
      limit = 10 
    } = req.query;
    
    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    // Build filter conditions
    const where = {};
    
    if (author) {
      where.author = { contains: author, mode: 'insensitive' };
    }
    
    if (category) {
      where.category = category;
    }
    
    if (rating) {
      where.rating = { gte: parseFloat(rating) };
    }
    
    if (title) {
      where.title = { contains: title, mode: 'insensitive' };
    }
    
    // Count total books matching filters
    const total = await prisma.book.count({ where });
    
    // Get books with pagination
    const books = await prisma.book.findMany({
      where,
      skip,
      take: parseInt(limit)
    });
    
    res.status(200).json({
      data: books,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get a book by ID
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const book = await prisma.book.findUnique({
      where: { id }
    });
    
    if (!book) {
      return res.status(404).json({ message: 'Book not found' });
    }
    
    res.status(200).json(book);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Update a book
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { title, author, category, price, rating, publishedDate } = req.body;
    
    // Check if book exists
    const book = await prisma.book.findUnique({
      where: { id }
    });
    
    if (!book) {
      return res.status(404).json({ message: 'Book not found' });
    }
    
    // Update book
    const updatedBook = await prisma.book.update({
      where: { id },
      data: {
        ...(title && { title }),
        ...(author && { author }),
        ...(category && { category }),
        ...(price !== undefined && { price: parseFloat(price) }),
        ...(rating !== undefined && { rating: parseFloat(rating) }),
        ...(publishedDate && { publishedDate: new Date(publishedDate) })
      }
    });
    
    res.status(200).json(updatedBook);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Delete a book
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    // Check if book exists
    const book = await prisma.book.findUnique({
      where: { id }
    });
    
    if (!book) {
      return res.status(404).json({ message: 'Book not found' });
    }
    
    // Delete book
    await prisma.book.delete({
      where: { id }
    });
    
    res.status(204).end();
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;