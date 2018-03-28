export default function whichAnimationEvent() {
	const el = document.createElement('fake');

	const animations = {
		animation: 'animationend',
		OAnimation: 'oAnimationEnd',
		MozAnimation: 'animationend',
		WebkitAnimation: 'webkitAnimationEnd'
	};

	for (const t in animations) {
		if (el.style[t] !== undefined) return animations[t];
	}
}
