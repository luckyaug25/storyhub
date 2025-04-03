require("dotenv").config();
const express = require("express");
const { Pool } = require("pg");
const bodyParser = require("body-parser");
const methodOverride = require("method-override");

const app = express();
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

app.set("view engine", "ejs");
app.use(express.static("public"));
app.use(bodyParser.urlencoded({ extended: true }));
app.use(methodOverride("_method"));

// 🏠 Homepage (List all stories)
app.get("/", async (req, res) => {
    const page = parseInt(req.query.page) || 1; // Default to page 1
    const storiesPerPage = 20;
  
    // Count total stories
    const countResult = await pool.query("SELECT COUNT(*) FROM stories");
    const totalStories = parseInt(countResult.rows[0].count);
    const totalPages = Math.ceil(totalStories / storiesPerPage);
  
    // Fetch paginated stories
    const offset = (page - 1) * storiesPerPage;
    const stories = await pool.query(
      "SELECT * FROM stories ORDER BY created_at DESC LIMIT $1 OFFSET $2",
      [storiesPerPage, offset]
    );
  
    res.render("home", {
      stories: stories.rows,
      page,
      totalPages,
    });
  });
  

// ✍️ Write Page
app.get("/write", (req, res) => {
  res.render("write");
});

// ✅ Post a Story
app.post("/stories", async (req, res) => {
  const { title, content } = req.body;
  await pool.query("INSERT INTO stories (title, content) VALUES ($1, $2)", [title, content]);
  res.redirect("/");
});

// 📖 Read a Full Story
app.get("/stories/:id", async (req, res) => {
    const { id } = req.params;
    const page = parseInt(req.query.page) || 1; // Default to page 1
    const linesPerPage = 200;
  
    const result = await pool.query("SELECT * FROM stories WHERE id = $1", [id]);
    const story = result.rows[0];
  
    if (!story) {
      return res.status(404).send("Story not found");
    }
  
    const contentLines = story.content.split("\n");
    const totalPages = Math.ceil(contentLines.length / linesPerPage);
    const start = (page - 1) * linesPerPage;
    const paginatedContent = contentLines.slice(start, start + linesPerPage);
  
    res.render("story", {
      story,
      paginatedContent,
      page,
      totalPages,
    });
  });
  

// ❌ Delete a Story
app.delete("/stories/:id", async (req, res) => {
  const { id } = req.params;
  await pool.query("DELETE FROM stories WHERE id = $1", [id]);
  res.redirect("/");
});

app.get("/stories/:id/edit", async (req, res) => {
    const { id } = req.params;
    const result = await pool.query("SELECT * FROM stories WHERE id = $1", [id]);
    res.render("edit", { story: result.rows[0] });
  });
  

  app.put("/stories/:id", async (req, res) => {
    const { id } = req.params;
    const { updatedContent } = req.body; // Use 'updatedContent' instead of 'newContent'

    await pool.query(
        "UPDATE stories SET content = $1, updated_at = NOW() WHERE id = $2",
        [updatedContent, id]
    );

    res.redirect(`/stories/${id}`);
});


  

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
