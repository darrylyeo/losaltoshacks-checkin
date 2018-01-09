const $ = document.querySelector.bind(document)
const $$ = document.querySelectorAll.bind(document)

FormData.prototype.toQueryString = function(){
	return Array.from(this.entries(), e => e.map(encodeURIComponent).join('=')).join('&')
}

function $createUserForm(user){
	const
		id = user.id
		$userForm = document.importNode($('#user-template').content, true).querySelector('form'),
		$revert = $userForm.querySelector('.revert'),
		$checkIn = $userForm.querySelector('.check-in'),
		$print = $userForm.querySelector('.print')
	
	const getUser = async function(){
		user = await fetch(`/user/${id}`).then(r => r.json())
	}

	const updateUI = function(){
		console.log(user, $userForm)
		for(const prop in user){
			const $input = $userForm.querySelector(`[name=${prop}]`)
			if($input){
				if($input.type === 'checkbox') $input.checked = user[prop]
				else $input.value = user[prop]
			}
		}
		if(user.events.includes('los-altos-hacks')){
			$userForm.classList.add('checked-in')
			$checkIn.innerText = '✓ Checked In'
		}
	}
	updateUI()

	for(const $input of $userForm.querySelectorAll('[name]')) $input.oninput = $input.onchange = function(){
		$userForm.classList.add('edit-mode')
	}

	// Update
	$userForm.onsubmit = async function(e){
		e.preventDefault()

		const response = await fetch(`/user/${id}`, {
			method: 'POST',
			body: new FormData(this)
		})
		.catch(console.error)
		.then(r => r.text())

		await getUser()
		$userForm.classList.remove('edit-mode')
		alert(response)
	}

	// Revert Update
	$revert.onclick = function(e){
		e.preventDefault()

		updateUI()
		$userForm.classList.remove('edit-mode')
	}

	// Print
	const $iframe = document.createElement('iframe')
	$userForm.appendChild($iframe)
	$print.onclick = function(e){
		e.preventDefault()

		$iframe.src = `/user/${id}/print`
		$iframe.onload = () => $iframe.contentWindow.print()
	}

	// Check In
	$checkIn.onclick = async function(e){
		e.preventDefault()

		const response = await fetch(`/event/los-altos-hacks?id=${user.id}`, {
			method: 'POST'
		})
		.catch(console.error)
		.then(r => r.text())

		await getUser()
		updateUI()
		alert(response)
	}

	return $userForm
}

$('#user-search').onsubmit = async function(e){
	e.preventDefault()

	const users = (await fetch(`/users?${new FormData(this).toQueryString()}`)
		.catch(console.error)
		.then(r => r.json()))
		.sort((u1, u2) => u1.events.includes('los-altos-hacks'))

	console.log(users)

	const $userForms = $('#users')
	while($userForms.firstChild) $userForms.removeChild($userForms.firstChild)
	for(const $userForm of users.map($createUserForm)) $userForms.appendChild($userForm)
}