import React, { useEffect, useRef } from 'react';
import { Box, Container, Typography, Button, Paper, Avatar } from '@mui/material';
import { ArrowForward, LocalLaundryService, Group, Star, Schedule, EnergySavingsLeaf, Speed, SupportAgent } from '@mui/icons-material';
import { Link as RouterLink } from 'react-router-dom';
import { keyframes } from '@emotion/react';

const fadeIn = keyframes`
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
`;

const slideIn = keyframes`
  from {
    opacity: 0;
    transform: translateX(-30px);
  }
  to {
    opacity: 1;
    transform: translateX(0);
  }
`;

const AnimatedBox = ({ children, delay = 0 }: { children: React.ReactNode, delay?: number }) => {
    const ref = useRef<HTMLDivElement>(null);
    useEffect(() => {
        const observer = new IntersectionObserver(
            (entries) => {
                if (entries[0].isIntersecting) {
                    ref.current?.style.setProperty('animation-delay', `${delay}s`);
                    ref.current?.classList.add('animate');
                }
            },
            { threshold: 0.1 }
        );
        if (ref.current) observer.observe(ref.current);
        return () => {
            if (ref.current) observer.unobserve(ref.current);
        };
    }, [delay]);

    return (
        <Box ref={ref} sx={{
            opacity: 0,
            '&.animate': {
                animation: `${fadeIn} 0.8s ease-out forwards`,
            }
        }}>
            {children}
        </Box>
    );
};


const FeatureCard = ({ icon, title, description }: { icon: React.ReactNode, title: string, description: string }) => (
    <Paper elevation={3} sx={{ p: 4, textAlign: 'center', borderRadius: 2, height: '100%' }}>
        <Avatar sx={{ bgcolor: 'primary.main', color: 'white', mx: 'auto', mb: 2, width: 56, height: 56 }}>
            {icon}
        </Avatar>
        <Typography variant="h6" gutterBottom>{title}</Typography>
        <Typography color="text.secondary">{description}</Typography>
    </Paper>
);

const TestimonialCard = ({ avatar, name, testimonial }: { avatar: string, name: string, testimonial: string }) => (
    <Paper elevation={3} sx={{ p: 3, borderRadius: 2, height: '100%' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
            <Avatar src={avatar} alt={name} sx={{ mr: 2 }} />
            <Typography variant="subtitle1" fontWeight="bold">{name}</Typography>
        </Box>
        <Typography color="text.secondary">"{testimonial}"</Typography>
    </Paper>
);

const HowItWorksStep = ({ icon, title, description, delay }: { icon: React.ReactNode, title: string, description: string, delay: number }) => (
    <AnimatedBox delay={delay}>
        <Box sx={{ textAlign: 'center' }}>
            <Avatar sx={{ bgcolor: 'secondary.main', color: 'white', mx: 'auto', mb: 2, width: 64, height: 64 }}>
                {icon}
            </Avatar>
            <Typography variant="h6" gutterBottom fontWeight="bold">{title}</Typography>
            <Typography color="text.secondary">{description}</Typography>
        </Box>
    </AnimatedBox>
);


const LandingPage: React.FC = () => {
    return (
        <Box sx={{ backgroundColor: '#f8f9fa' }}>
            {/* Hero Section */}
            <Box
                sx={{
                    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                    color: 'white',
                    py: { xs: 10, md: 20 },
                    textAlign: 'center',
                    clipPath: 'polygon(0 0, 100% 0, 100% 85%, 0% 100%)',
                }}
            >
                <Container>
                    <Typography variant="h2" component="h1" fontWeight="bold" gutterBottom sx={{ animation: `${fadeIn} 1s ease-in-out` }}>
                        Effortless Laundry, Delivered.
                    </Typography>
                    <Typography variant="h5" component="p" sx={{ mb: 4, animation: `${fadeIn} 1s ease-in-out 0.2s`, opacity: 0.9 }}>
                        Pristine clean clothes, without the hassle. We pick up, clean, and deliver right to your door.
                    </Typography>
                    <Button
                        component={RouterLink}
                        to="/register"
                        variant="contained"
                        size="large"
                        endIcon={<ArrowForward />}
                        sx={{ 
                            bgcolor: 'white', 
                            color: 'primary.main',
                            fontWeight: 'bold',
                            px: 4,
                            py: 1.5,
                            borderRadius: '50px',
                            '&:hover': { bgcolor: '#f0f0f0', transform: 'translateY(-2px)' },
                            transition: 'transform 0.2s',
                            animation: `${fadeIn} 1s ease-in-out 0.4s`
                        }}
                    >
                        Get Started Free
                    </Button>
                </Container>
            </Box>

            {/* Features Section */}
            <Container sx={{ py: 10, mt: -8 }}>
                <Box sx={{ display: 'flex', gap: 4, flexWrap: 'wrap', justifyContent: 'center' }}>
                    <AnimatedBox delay={0}>
                        <Box sx={{ width: { xs: '100%', md: '300px' } }}>
                            <FeatureCard
                                icon={<LocalLaundryService />}
                                title="Pristine Cleaning"
                                description="We use eco-friendly products to ensure your clothes are sparkling clean and fresh."
                            />
                        </Box>
                    </AnimatedBox>
                    <AnimatedBox delay={0.2}>
                        <Box sx={{ width: { xs: '100%', md: '300px' } }}>
                            <FeatureCard
                                icon={<Group />}
                                title="Dedicated Team"
                                description="Our professional team handles your laundry with the utmost care and precision."
                            />
                        </Box>
                    </AnimatedBox>
                    <AnimatedBox delay={0.4}>
                        <Box sx={{ width: { xs: '100%', md: '300px' } }}>
                            <FeatureCard
                                icon={<Star />}
                                title="Customer First"
                                description="Your satisfaction is our priority. Enjoy seamless service from start to finish."
                            />
                        </Box>
                    </AnimatedBox>
                </Box>
            </Container>

             {/* How It Works Section */}
            <Box sx={{ py: 10, backgroundColor: 'white' }}>
                <Container>
                    <Typography variant="h4" component="h2" fontWeight="bold" align="center" gutterBottom>
                        How It Works
                    </Typography>
                     <Typography align="center" color="text.secondary" sx={{ mb: 6, maxWidth: '600px', mx: 'auto' }}>
                        Getting your laundry done has never been easier. Just a few simple steps.
                    </Typography>
                    <Box sx={{ display: 'flex', gap: 4, flexWrap: 'wrap', justifyContent: 'center' }}>
                        <HowItWorksStep
                            icon={<Schedule />}
                            title="1. Schedule Pickup"
                            description="Choose a convenient time and place for us to pick up your laundry."
                            delay={0.1}
                        />
                        <HowItWorksStep
                            icon={<LocalLaundryService />}
                            title="2. We Clean"
                            description="Our experts clean your clothes with the best products and techniques."
                            delay={0.3}
                        />
                        <HowItWorksStep
                            icon={<Speed />}
                            title="3. We Deliver"
                            description="Get your fresh, clean laundry delivered back to your door, ready to wear."
                            delay={0.5}
                        />
                    </Box>
                </Container>
            </Box>

            {/* Key Benefits Section */}
            <Container sx={{ py: 10 }}>
                <Typography variant="h4" component="h2" fontWeight="bold" align="center" gutterBottom>
                    Why Choose Us?
                </Typography>
                 <Box sx={{ display: 'flex', gap: 4, flexWrap: 'wrap', justifyContent: 'center', mt: 6 }}>
                    <AnimatedBox delay={0.1}>
                         <FeatureCard
                            icon={<EnergySavingsLeaf />}
                            title="Eco-Friendly"
                            description="We use sustainable, non-toxic cleaning agents that are safe for you and the planet."
                        />
                    </AnimatedBox>
                    <AnimatedBox delay={0.3}>
                         <FeatureCard
                            icon={<Speed />}
                            title="Fast Turnaround"
                            description="Get your laundry back in as little as 24 hours with our express service options."
                        />
                    </AnimatedBox>
                    <AnimatedBox delay={0.5}>
                        <FeatureCard
                            icon={<SupportAgent />}
                            title="Dedicated Support"
                            description="Our friendly support team is here to help you with any questions, 7 days a week."
                        />
                    </AnimatedBox>
                </Box>
            </Container>
            
            {/* Testimonials Section */}
            <Box sx={{ backgroundColor: 'white', py: 10 }}>
                <Container>
                    <Typography variant="h4" component="h2" fontWeight="bold" align="center" gutterBottom>
                        Loved by Customers
                    </Typography>
                    <Box sx={{ display: 'flex', gap: 4, flexWrap: 'wrap', justifyContent: 'center', mt: 4 }}>
                        <AnimatedBox delay={0.2}>
                            <Box sx={{ width: { xs: '100%', md: '300px' } }}>
                                <TestimonialCard
                                    avatar="https://tse1.mm.bing.net/th/id/OIP.1thT7XTfhuUq-whpFYhJSgHaOD?rs=1&pid=ImgDetMain&o=7&rm=3"
                                    name="Ama Mensah"
                                    testimonial="Seamless service here in Accra. Clothes came back crisp and fresh — highly recommended!"
                                />
                            </Box>
                        </AnimatedBox>
                        <AnimatedBox delay={0.4}>
                            <Box sx={{ width: { xs: '100%', md: '300px' } }}>
                                <TestimonialCard
                                    avatar="https://www.nairaland.com/attachments/6983350_img20180416175545_jpeg6bb5bc65d69b872f4263b83414c50ab5"
                                    name="Kwame Boateng"
                                    testimonial="Best laundry service I’ve used in Ghana. Professional, on time, and my clothes have never looked better."
                                />
                            </Box>
                        </AnimatedBox>
                        <AnimatedBox delay={0.6}>
                            <Box sx={{ width: { xs: '100%', md: '300px' } }}>
                                <TestimonialCard
                                    avatar="https://www.bing.com/images/search?view=detailV2&ccid=r7AVPqSS&id=A7659C6B3E056A722C5FC74E353E99180F625016&thid=OIP.r7AVPqSSaYPczWN3jdbzZAHaJQ&mediaurl=https%3a%2f%2fth.bing.com%2fth%2fid%2fR.afb0153ea4926983dccd63778dd6f364%3frik%3dFlBiDxiZPjVOxw%26riu%3dhttp%253a%252f%252fwww.classicghana.com%252fwp-content%252fuploads%252f2020%252f02%252fafrican-kente-beauty-1.jpg%26ehk%3dm95NHezzpoB3ymGxkKR3mxnMcPO3lv0Bfskc5Tv3RxM%253d%26risl%3d%26pid%3dImgRaw%26r%3d0&exph=1250&expw=1000&q=Beautiful+Woman+in+Ghanaian&FORM=IRPRST&ck=C9AD30AC4DED56A06E410BFB910A470F&selectedIndex=8&itb=0"
                                    name="Akosua Nkrumah"
                                    testimonial="Scheduling pickup is so easy and saves me time. Quality has been consistently great."
                                />
                            </Box>
                        </AnimatedBox>
                    </Box>
                </Container>
            </Box>

            {/* Final CTA */}
            <Box sx={{ py: 10, textAlign: 'center' }}>
                <Container>
                    <AnimatedBox>
                        <Typography variant="h4" component="h2" fontWeight="bold" gutterBottom>
                            Ready for a Laundry Revolution?
                        </Typography>
                        <Button
                            component={RouterLink}
                            to="/register"
                            variant="contained"
                            size="large"
                            endIcon={<ArrowForward />}
                             sx={{ 
                                fontWeight: 'bold',
                                px: 4,
                                py: 1.5,
                                borderRadius: '50px',
                                '&:hover': { transform: 'translateY(-2px)' },
                                transition: 'transform 0.2s',
                            }}
                        >
                            Sign Up Now
                        </Button>
                    </AnimatedBox>
                </Container>
            </Box>

             {/* Footer */}
             <Box component="footer" sx={{ p: 4, background: '#333', color: 'white' }}>
                <Typography variant="body2" align="center">
                    © {new Date().getFullYear()} LaundryApp. All rights reserved.
                </Typography>
             </Box>
        </Box>
    );
};

export default LandingPage; 