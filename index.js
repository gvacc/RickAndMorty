const db = require('./database')
const format = require('pg-format')
const axios = require('axios')

const TABLENAME = 'dertalian'
const CHARACTERS_URL = 'https://rickandmortyapi.com/api/character'

const getAllCharacters = async () => {
	try {
		console.log('Начинаем парсинг всех персонажей...')
		let characters = []
		let response = await axios.get(CHARACTERS_URL)
		const amountPages = response.data.info.pages
		let currentPage = 1
		console.log(`Страница ${currentPage} из ${amountPages} получена!`)
		
		characters = characters.concat(response.data.results)

		while (currentPage < amountPages) {
			try {
				currentPage++
				response = await axios.get(response.data.info.next)
				characters = characters.concat(response.data.results)
				console.log(`Страница ${currentPage} из ${amountPages} получена!`)
			}	catch(e) {
				throw new Error(`Ошибка при получении страницы № ${currentPage} - ${e}`)
			}
		}
		console.log(`[+] Парсинг завершен!`)
		return characters
	}catch(e) {
		console.log(e)
		throw new Error(`Ошибка при получения персонажей ${e}`)
	}
}

const transformCharactersDataForSQL = (characters) => {
	return characters.map((character) => { //Удаляем name и id в поле data, т.к они уже есть на уровне выше и преобразуем character в json
			const name = character.name
			delete character.name
			delete character.id
			return [name, JSON.stringify({...character})]
	})
}

const migrateAllCharacters = async () => {
		const characters = transformCharactersDataForSQL(await getAllCharacters())
		try {
			console.log('Начинаем миграцию...')
			const result = await db.query(format(`INSERT INTO ${TABLENAME} (name, data) VALUES %L`, characters))
			console.log('[+] Миграция завершена! Всего персонажей: ' + characters.length)
	} catch(e) {
		console.log('Ошибка при миграции', e)
	}
}

const start = async () => {
	try {
		await db.connect()
		
		await db.query(`DROP TABLE IF EXISTS ${TABLENAME}`)
		await db.query(`CREATE TABLE ${TABLENAME} (id SERIAL PRIMARY KEY,name TEXT,data JSONB);`)
		console.log(`[+] Создали таблицу ${TABLENAME}`)

		await migrateAllCharacters();
		await db.end()
	} catch(e) {
		console.log('Ошибка', e)
	}
}

start()