<template>
  <div class="min-h-screen bg-pawbby-bg text-white font-sans flex flex-col">
    <!-- Main Content -->
    <main class="flex-1 max-w-lg mx-auto w-full flex flex-col">
      <slot />
    </main>

    <!-- Bottom Navigation -->
    <nav class="flex justify-around items-center p-4 pb-8 bg-pawbby-bg border-t border-white/5 max-w-lg mx-auto w-full mt-auto">
      <NuxtLink to="/" class="flex flex-col items-center p-2 transition-colors text-pawbby-mutedDark hover:text-pawbby-muted" active-class="!text-pawbby-secondary" exact-active-class="!text-pawbby-secondary">
        <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" viewBox="0 0 24 24" fill="currentColor">
          <path d="M11.47 3.84a.75.75 0 011.06 0l8.69 8.69a.75.75 0 101.06-1.06l-8.689-8.69a2.25 2.25 0 00-3.182 0l-8.69 8.69a.75.75 0 001.061 1.06l8.69-8.69z" />
          <path d="M12 5.432l8.159 8.159c.03.03.06.058.091.086v6.198c0 1.035-.84 1.875-1.875 1.875H15a.75.75 0 01-.75-.75v-4.5a.75.75 0 00-.75-.75h-3a.75.75 0 00-.75.75V21a.75.75 0 01-.75.75H5.625a1.875 1.875 0 01-1.875-1.875v-6.198a2.29 2.29 0 00.091-.086L12 5.43z" />
        </svg>
      </NuxtLink>
      
      <NuxtLink to="/profile" class="flex flex-col items-center p-2 transition-colors text-pawbby-mutedDark hover:text-pawbby-muted" active-class="!text-pawbby-secondary" exact-active-class="!text-pawbby-secondary">
        <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" viewBox="0 0 24 24" fill="currentColor">
          <path fill-rule="evenodd" d="M7.5 6a4.5 4.5 0 119 0 4.5 4.5 0 01-9 0zM3.751 20.105a8.25 8.25 0 0116.498 0 .75.75 0 01-.437.695A18.683 18.683 0 0112 22.5c-2.786 0-5.433-.608-7.812-1.7a.75.75 0 01-.437-.695z" clip-rule="evenodd" />
        </svg>
      </NuxtLink>
    </nav>
  </div>
</template>
