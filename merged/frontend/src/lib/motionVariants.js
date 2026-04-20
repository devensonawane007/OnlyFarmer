export const pageVariants = {
    initial: {
        x: 40,
        opacity: 0
    },
    animate: {
        x: 0,
        opacity: 1,
        transition: {
            type: "spring",
            stiffness: 260,
            damping: 28
        }
    },
    exit: {
        x: -40,
        opacity: 0,
        transition: {
            type: "spring",
            stiffness: 260,
            damping: 28
        }
    }
};

export const cardVariants = {
    hidden: { y: 24, opacity: 0 },
    visible: {
        y: 0,
        opacity: 1,
        transition: {
            type: "spring",
            stiffness: 300,
            damping: 24
        }
    },
    container: {
        visible: {
            transition: {
                staggerChildren: 0.07
            }
        }
    }
};

export const heroWordVariants = {
    hidden: { y: 60, opacity: 0, rotate: -8 },
    visible: {
        y: 0,
        opacity: 1,
        rotate: 0,
        transition: {
            type: "spring",
            stiffness: 80,
            damping: 18
        }
    }
};

export const drawerVariants = {
    hidden: { height: 0, opacity: 0, overflow: "hidden" },
    visible: {
        height: "auto",
        opacity: 1,
        transition: {
            height: {
                type: "spring",
                stiffness: 100,
                damping: 20
            }
        }
    }
};

export const tabUnderline = {
    layoutId: "underline",
    transition: { type: "spring", bounce: 0.2, duration: 0.6 }
};

export const scrollReveal = {
    initial: { y: 60, opacity: 0 },
    animate: {
        y: 0,
        opacity: 1,
        transition: {
            duration: 0.8,
            ease: [0.16, 1, 0.3, 1]
        }
    }
};

export const staggerContainer = {
    initial: {},
    animate: {
        transition: {
            staggerChildren: 0.1,
            delayChildren: 0.2
        }
    }
};
