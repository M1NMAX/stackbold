<script lang="ts">
	import logoSrc from '$lib/assets/logo.svg';
</script>

<div
	class="h-screen flex flex-col items-center justify-center space-y-8 py-4 sm:px-6 lg:px-8 bg-popover text-foreground"
>
	<div class="sm:mx-auto sm:w-full sm:max-w-sm">
		<div class="flex justify-center pb-8">
			<img src={logoSrc} alt="logo" width="100" />
		</div>

		<slot />
	</div>

	<footer>
		<p>
			Stackbold created by
			<a href="https://github.com/M1NMAX/stackbold" class="text-primary hover:text-primary/70">
				M1NMAX
			</a>
		</p>
	</footer>
</div>
