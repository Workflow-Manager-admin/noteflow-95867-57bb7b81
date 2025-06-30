import React, { useState, useEffect } from 'react';
import './App.css';

// Asset imports – images placed in src/assets in build step
import berrySmoothieBowl from './assets/berry_smoothie_bowl.jpg';
import vegetarianPizza from './assets/vegetarian_pizza.jpg';
import salmonTeriyaki from './assets/salmon_teriyaki.jpg';

// Map asset filename (from backend) -> import
const recipeImgAssets = {
  'berry_smoothie_bowl.jpg': berrySmoothieBowl,
  'vegetarian_pizza.jpg': vegetarianPizza,
  'salmon_teriyaki.jpg': salmonTeriyaki
};

// PUBLIC_INTERFACE
function RecipeCard({ recipe, onEdit, onDelete }) {
  return (
    <div className="recipe-card">
      <div className="recipe-card__image-container">
        <img
          src={recipeImgAssets[recipe.image] || berrySmoothieBowl}
          alt={recipe.alt || recipe.title}
          className="recipe-card__image"
          draggable="false"
        />
        <div className="recipe-card__overlay">
          <h3 className="recipe-card__title">{recipe.title}</h3>
        </div>
      </div>
      <div className="recipe-card__content">
        <div className="recipe-card__meta">{recipe.meta}</div>
        <div className="recipe-card__desc">{recipe.description}</div>
        <div style={{marginTop: '12px', display: 'flex', gap: '8px'}}>
          <button className="recipe-card__button" onClick={() => onEdit(recipe)}>✏️ Edit</button>
          <button className="recipe-card__button recipe-card__button--danger" onClick={() => onDelete(recipe.id)}>🗑 Delete</button>
        </div>
      </div>
    </div>
  );
}

// PUBLIC_INTERFACE
function RecipeForm({ current, onSave, onCancel }) {
  const [title, setTitle] = useState(current?.title || '');
  const [description, setDescription] = useState(current?.description || '');
  const [meta, setMeta] = useState(current?.meta || '');
  const [image, setImage] = useState(current?.image || Object.keys(recipeImgAssets)[0]);

  useEffect(() => {
    if (current) {
      setTitle(current.title || '');
      setDescription(current.description || '');
      setMeta(current.meta || '');
      setImage(current.image || Object.keys(recipeImgAssets)[0]);
    }
  }, [current]);

  // PUBLIC_INTERFACE
  function handleSubmit(e) {
    e.preventDefault();
    onSave({
      title,
      description,
      meta,
      image
    });
  }

  return (
    <form className="recipe-form" onSubmit={handleSubmit}>
      <h3>{current ? "Edit" : "Create"} Recipe</h3>
      <label>
        Title:<br/>
        <input value={title} onChange={e => setTitle(e.target.value)} required maxLength={60} />
      </label>
      <label>
        Description:<br/>
        <textarea value={description} onChange={e => setDescription(e.target.value)} rows={2} maxLength={120} />
      </label>
      <label>
        Meta (ex: 10 min • 320 kcal):<br/>
        <input value={meta} onChange={e => setMeta(e.target.value)} maxLength={40} />
      </label>
      <label>
        Image:<br/>
        <select value={image} onChange={e => setImage(e.target.value)}>
          {Object.entries(recipeImgAssets).map(([fname, _]) =>
            <option value={fname} key={fname}>{fname.replace(/_/g, ' ').replace('.jpg','')}</option>
          )}
        </select>
      </label>
      <div style={{marginTop:"12px", display:"flex", gap:"12px"}}>
        <button className="recipe-card__button" type="submit">{current ? "Save" : "Create"}</button>
        <button className="recipe-card__button recipe-card__button--secondary" type="button" onClick={onCancel}>Cancel</button>
      </div>
    </form>
  );
}

// PUBLIC_INTERFACE
function App() {
  const [theme, setTheme] = useState('light');
  const [recipes, setRecipes] = useState([]);
  const [editRecipe, setEditRecipe] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const API_BASE = process.env.REACT_APP_API_BASE || "http://localhost:8000";

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  // Load recipes
  useEffect(() => {
    fetch(`${API_BASE}/recipes`)
      .then(res => res.json())
      .then(data => setRecipes(data));
  }, []);

  // PUBLIC_INTERFACE
  const toggleTheme = () => {
    setTheme(prevTheme => prevTheme === 'light' ? 'dark' : 'light');
  };

  // PUBLIC_INTERFACE
  function handleCreate() {
    setEditRecipe(null);
    setShowForm(true);
  }

  // PUBLIC_INTERFACE
  function handleEdit(recipe) {
    setEditRecipe(recipe);
    setShowForm(true);
  }

  // PUBLIC_INTERFACE
  function handleDelete(id) {
    if(!window.confirm("Delete this recipe?")) return;
    fetch(`${API_BASE}/recipes/${id}`, { method: "DELETE" })
      .then(_ => setRecipes(recipes.filter(r => r.id !== id)));
  }

  // PUBLIC_INTERFACE
  function handleSave(form) {
    if(editRecipe){
      fetch(`${API_BASE}/recipes/${editRecipe.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form)
      }).then(res => res.json())
        .then(saved => {
          setRecipes(recipes.map(r => r.id === editRecipe.id ? saved : r));
          setShowForm(false);
        });
    } else {
      fetch(`${API_BASE}/recipes`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form)
      }).then(res => res.json())
        .then(newRecipe => {
          setRecipes([...recipes, newRecipe]);
          setShowForm(false);
        });
    }
  }

  return (
    <div className="App">
      <header className="notes-nav">
        <span className="notes-title">🍲 Notes/Recipe App</span>
        <button 
          className="theme-toggle" 
          onClick={toggleTheme}
          aria-label={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
        >
          {theme === 'light' ? '🌙 Dark' : '☀️ Light'}
        </button>
      </header>
      <main className="notes-main">
        <div className="notes-main-header">
          <h1>All Recipes</h1>
          <button className="recipe-card__button recipe-card__button--accent" onClick={handleCreate}>+ Add Recipe</button>
        </div>
        {showForm ? (
          <RecipeForm current={editRecipe} onSave={handleSave} onCancel={() => setShowForm(false)} />
        ) : (
          <div className="recipe-card-list">
            {recipes.length === 0
              ? <p>No recipes yet!</p>
              : recipes.map(recipe =>
                <RecipeCard key={recipe.id} recipe={recipe} onEdit={handleEdit} onDelete={handleDelete}/>
              )
            }
          </div>
        )}
      </main>
    </div>
  );
}

export default App;
