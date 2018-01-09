const express = require('express')
const bodyParser = require('body-parser')
const lowdb = require('lowdb')
const FileAsync = require('lowdb/adapters/FileAsync')
const shortid = require('shortid')

// Create server
const app = express()
//app.use(bodyParser.json())

app.use('/', express.static(__dirname + '/frontend'))
app.get('/', (req, res) => res.sendFile(__dirname + '/frontend/index.html'))


// User
class User {
	constructor({id = shortid.generate(), first, last, type, organization, vegan, gluten}){
		Object.assign(this, {id, first, last, type, organization, vegan, gluten}, {
			printCount: 0,
			events: []
		})
	}
	toString(){
		return `${this.type} ${this.first} ${this.last} (ID ${this.id})`
	}
}


// Create database instance and start server
!(async () => {
	const db = await lowdb(new FileAsync('database.json'))

	// Set db default values
	await db.defaults({
		users: [
			{first: 'Ella', last: 'Haxx', type: 'hacker', organization: 'Los Altos High School', vegan: true, gluten: false, events: []},
			{first: 'Jamsheed', last: 'Mistri', type: 'organizer', organization: 'Los Altos High School', vegan: false, gluten: false, events: ['check-in']},
			{first: 'Ella', last: 'Haxx', type: 'hacker', organization: 'Los Altos High School', vegan: true, gluten: false, events: []},
			{first: 'Jamsheed', last: 'Mistri', type: 'organizer', organization: 'Los Altos High School', vegan: false, gluten: false, events: ['check-in']},
			{first: 'Ella', last: 'Haxx', type: 'hacker', organization: 'Los Altos High School', vegan: true, gluten: false, events: []},
			{first: 'Jamsheed', last: 'Mistri', type: 'organizer', organization: 'Los Altos High School', vegan: false, gluten: false, events: ['check-in']}
		].map(u => new User(u)),
		events: ['lunch', 'dinner']
	}).write()


	function getUserByID(id){
		return db.get('users')
			.find({id})
	}
	

	// Routing
	
	// Get a user by id
	// GET /user/:id
	app.get('/user/:id', (req, res) => {
		const {id} = req.params
		const user = getUserByID(id).value()
		res.send(user)
	})

	// Generate a nametag for a user.
	// GET /user/:id/print
	app.get('/user/:id/print', async (req, res) => {
		const userQuery = getUserByID(id)
		await userQuery
			.forEach(user => user.printCount++)
			.write()
		
		const user = new User(userQuery.value())
		res.send(`
			<h1>${user.first} ${user.last}</h1>
			<p>${user.id}</p>
		`)
	})

	// Search for users by any combination of first, last, type, organization
	// GET /users?first&last&type&organization
	app.get('/users', (req, res) => {
		const {first = '', last = '', type = '', organization = '', vegan, gluten} = req.query
		const users = db.get('users')
			.filter(user =>
				user.first.startsWith(first) &&
				user.last.startsWith(last) &&
				user.type.startsWith(type) &&
				user.organization.startsWith(organization)
			)
			.value()
		res.send(users)
	})

	// Register a new user.
	// POST /user
	app.post('/user', async (req, res) => {
		const user = new User(req.params)

		await db.get('users')
			.push(user)
			.write()
		
		res.send(`Registered ${user}.`)
	})

	// Update an existing user by ID.
	// POST /user
	app.post('/user/:id', async (req, res) => {
		const {first, last, type, organization, vegan, gluten} = req.query
		const {id} = req.params

		const userQuery = await getUserByID(id)
			.assign({first, last, type, organization, vegan, gluten})
			.write()
		
		const user = new User(userQuery.value())
		res.send(`Updated ${user}.`)
	})

	// Check a user into an event.
	// POST /event/:event?id
	app.post('/event/:event', async (req, res) => {
		const {event} = req.params
		const {id} = req.query

		const userQuery = getUserByID(id)
		const user = {events} = new User(userQuery.value())

		if(events.includes(event)){
			res.send(`Whoops! ${user} was already checked in to event "${event}"!`)
		}else{
			events.push(event)
			await userQuery
				.assign({events})
				.write()
			res.send(`Success! ${user} has checked in to event "${event}"!`)
		}
	})

	app.listen(3000, () => console.log('Listening on port 3000.'))
})()